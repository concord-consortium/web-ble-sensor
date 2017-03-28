(function(){
  const ctx = $('#canvas')[0].getContext('2d');
  const showDisconnect = function(server) {
      const disconnect = function() {
        clearInterval(window.takeReadingIntervalID);
        server.disconnect();
        $("#disconnect").hide();
        $("#connect").show();
      };
      $("#disconnect").click(disconnect);
      $("#connect").hide();
      $("#disconnect").show();
  };

  const tagIdentifier    = 0xaa80;
  const tempAServiceAddr  = 'f000aa00-0451-4000-b000-000000000000';
  const tempAValueAddr    = 'f000aa01-0451-4000-b000-000000000000';
  const tempBServiceAddr  = 'f000bb00-0451-4000-b000-000000000000';
  const tempBValueAddr    = 'f000bb01-0451-4000-b000-000000000000';

  var   service;

  var chartDataA = [];
  var chartDataB = [];
  var myChart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets:  [{
          label: 'Temperature A',
          fill: false,
          borderColor: 'red',
          data : chartDataA
        },
        {
          label: 'Temperature B',
          fill: false,
          borderColor: 'blue',
          data : chartDataB
        }]
      },
      options: {
        scales: {
            xAxes: [{ type: 'linear', position: 'bottom' }]
          }
        }
     });

  var startTime = Date.now();
  const drawGraph = function(valueA, valueB) {
    chartDataA.push({x: (Date.now() - startTime)/1000, y:valueA});
    chartDataB.push({x: (Date.now() - startTime)/1000, y:valueB});
    myChart.update();
  }


  const computeTemp = function(byteArray) {
    // javascript integers are 32bits so this should work
    // There is a DataView object that would might be better to try here it allows
    // the user to control the endianess of the value can can read from any buffer
    var temp100 =
      byteArray.getUint8(3) << 24 |
      byteArray.getUint8(2) << 16 |
      byteArray.getUint8(1) << 8  |
      byteArray.getUint8(0);

    // the temperature data is returned in celcius times 100 so we need to divide
    return temp100/ 100.0;
  };

  const readTemp = function(byteArrayA, byteArrayB) {
    var valueA = computeTemp(byteArrayA);
    var valueB = computeTemp(byteArrayB);
    $("#tempA > .value").text(valueA);
    $("#tempB > .value").text(valueB);
    drawGraph(valueA, valueB);

  };

  const connect = function() {
    let request = navigator.bluetooth.requestDevice({
      filters: [{ name: "Thermoscope" }],
      optionalServices: [tempAServiceAddr, tempBServiceAddr]
    })
    let characteristicA, characteristicB;

    // Step 2: Connect to it
    request.then(function(device) {
      return device.gatt.connect();
    })
    // Step 3: Get the Service
    .then(function(server) {
      showDisconnect(server);
      window.server = server;
      return server.getPrimaryService(tempAServiceAddr);
    })
    .then(function(service){
      return service.getCharacteristic(0x0001);
    })
    .then(function(_characteristicA){
      characteristicA = _characteristicA;

      // get second service
      return server.getPrimaryService(tempBServiceAddr);
    })
    .then(function(service){
      return service.getCharacteristic(0x0001);
    })
    .then(function(characteristicB){
      startTime = Date.now();
      const takeReading = function() {
        let arrayA;
        characteristicA.readValue()
        .then(function(_arrayA){
          arrayA = _arrayA;
          return characteristicB.readValue();
        })
        .then(function(arrayB){
          readTemp(arrayA, arrayB);
        });
      };
      window.takeReadingIntervalID = setInterval(takeReading,600);
    })
    .catch(function(error) {
      console.error('Connection failed!', error);
    });
  };
  $('#connect').click(connect);
})();
