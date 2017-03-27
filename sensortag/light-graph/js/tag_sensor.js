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
  const tempEnableAddr   = 'f000aa02-0451-4000-b000-000000000000';

  const lightServiceAddr  = 'f000aa70-0451-4000-b000-000000000000';
  const lightValueAddr    = 'f000aa71-0451-4000-b000-000000000000';
  const lightEnableAddr   = 'f000aa72-0451-4000-b000-000000000000';


  var   service;

  const enableTemp = function(service) {
    const on      = new Uint8Array([0x01]);
    const promise = new Promise( function(resolve,reject) {
      const tempEnableC = service.getCharacteristic(tempEnableAddr);
      tempEnableC.then(function(characteristic){
        characteristic.writeValue(on)
        .then(function() {
          console.log("temperature reading enabled...");
          resolve(service);
        })
        .catch(function(err) { reject(err); });
      });
    });
    return promise;
  };

  const enableLight = function(service) {
    const on      = new Uint8Array([0x01]);
    const promise = new Promise( function(resolve,reject) {
      const tempEnableC = service.getCharacteristic(lightEnableAddr);
      tempEnableC.then(function(characteristic){
        characteristic.writeValue(on)
        .then(function() {
          console.log("light reading enabled...");
          resolve(service);
        })
        .catch(function(err) { reject(err); });
      });
    });
    return promise;
  };

  var chartData = [];
  var myChart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets:  [{
          label: 'Light',
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


  const readLight = function(byteArray) {
    var lightLSB = byteArray.getUint8(0);
    var lightMSB = byteArray.getUint8(1);

    var light  = lightMSB << 8 | lightLSB
    $("#light > .value").text(light);
    drawGraph(light);
  }

  const readTemps = function(byteArray) {
    var irLSB = byteArray.getUint8(0);
    var irMSB = byteArray.getUint8(1);

    var ambientLSB = byteArray.getUint8(2);
    var ambientMSB = byteArray.getUint8(3);

    var ir  = irMSB << 8 | irLSB
    var ambient = ambientMSB << 8 | ambientLSB

    $("#ambientTemp > .value").text(ambient);
    $("#ObjTemp > .value").text(object);
  };

  const connect = function() {
    let request = navigator.bluetooth.requestDevice({
      filters: [{ services: [tagIdentifier] }],
      optionalServices: [lightServiceAddr]
    })
    // Step 2: Connect to it
    request.then(function(device) {
      return device.gatt.connect();
    })
    // Step 3: Get the Service
    .then(function(server) {
      showDisconnect(server);
      window.server = server;
      return server.getPrimaryService(lightServiceAddr);;
    })
    .then(function(service) {
      return enableLight(service)
    })
    .then(function(service){
      return service.getCharacteristic(lightValueAddr);
    })
    .then(function(characteristic){
      const takeReading = function() {
        var vc = characteristic.readValue();
        vc.then(readLight);
      };
      setInterval(takeReading,600);
    })

    .catch(function(error) {
     console.error('Connection failed!', error);
    });
  };
  $('#connect').click(connect);
})();
