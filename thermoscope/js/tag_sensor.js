(function(){
  const ctx = $('#canvas')[0].getContext('2d');
  const showDisconnect = function(server) {
      const disconnect = function() {
        server.disconnect();
        $("#disconnect").hide();
        $("#connect").show();
      };
      $("#disconnect").click(disconnect);
      $("#connect").hide();
      $("#disconnect").show();
  };

  const tagIdentifier    = 0xaa80;
  const tempServiceAddr  = 'f000aa00-0451-4000-b000-000000000000';
  const tempValueAddr    = 'f000aa01-0451-4000-b000-000000000000';

  var   service;

  var chartData = [];
  var myChart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets:  [{
          label: 'Temperature',
          data : chartData,
        }]
      },
      options: {
        scales: {
            xAxes: [{ type: 'linear', position: 'bottom' }]
          }
        }
     });

  var startTime = Date.now();
  const drawGraph = function(value) {
    chartData.push({x: (Date.now() - startTime)/1000, y:value});
    myChart.update();
  }


  const readTemp = function(byteArray) {
    // javascript integers are 32bits so this should work
    // There is a DataView object that would might be better to try here it allows
    // the user to control the endianess of the value can can read from any buffer
    var temp100 =
      byteArray.getUint8(3) << 24 |
      byteArray.getUint8(2) << 16 |
      byteArray.getUint8(1) << 8  |
      byteArray.getUint8(0);

    // the temperature data is returned in celcius times 100 so we need to divide
    var temp = temp100/ 100.0;
    $("#light > .value").text(temp);
    drawGraph(temp);

  };

  const connect = function() {
    let request = navigator.bluetooth.requestDevice({
      filters: [{ name: "Thermoscope" }],
      optionalServices: [tempServiceAddr]
    })
    // Step 2: Connect to it
    request.then(function(device) {
      return device.gatt.connect();
    })
    // Step 3: Get the Service
    .then(function(server) {
      showDisconnect(server);
      window.server = server;
      return server.getPrimaryService(tempServiceAddr);;
    })
    .then(function(service){
      return service.getCharacteristic(0x0001);
//      return service.getCharacteristic(tempValueAddr);
    })
    .then(function(characteristic){
      startTime = Date.now();
      const takeReading = function() {
        var vc = characteristic.readValue();
        vc.then(readTemp);
      };
      setInterval(takeReading,600);
    })

    .catch(function(error) {
     console.error('Connection failed!', error);
    });
  };
  $('#connect').click(connect);
})();
