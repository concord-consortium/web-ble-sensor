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

  const lightServiceAddr  = 'f000aa70-0451-4000-b000-000000000000';
  const lightValueAddr    = 'f000aa71-0451-4000-b000-000000000000';
  const lightEnableAddr   = 'f000aa72-0451-4000-b000-000000000000';

  var   service;

  const enableLight = function(service) {
    const on      = new Uint8Array([0x01]);
    const promise = new Promise( function(resolve,reject) {
      const lightEnableC = service.getCharacteristic(lightEnableAddr);
      lightEnableC.then(function(characteristic){
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

  const drawGraph = function(value) {
    const size = 150
    const maxValue = 30000
    const x = size /2
    const y = x
    const scale = size / (2 * maxValue);
    const radius = scale * value
    ctx.fillStyle = 'hsl(0,10%,97%)'
    ctx.fillRect(0,0,size,size)
    ctx.fillStyle = 'hsl(200,30%,30%)'
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }


  const readLight = function(byteArray) {
    var lightLSB = byteArray.getUint8(0);
    var lightMSB = byteArray.getUint8(1);

    var light  = lightMSB << 8 | lightLSB
    $("#light > .value").text(light);
    drawGraph(light);
  }

  const connect = function() {
    // Step 1: ask bluetooth service for a device
    // this will trigger a dialog in the browser asking the user to select a device
    // that matches these criteria
    navigator.bluetooth.requestDevice({
      filters: [{ services: [tagIdentifier] }],
      optionalServices: [lightServiceAddr]
    })
    // Step 2: Connect to it
    .then(function(device) {
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
