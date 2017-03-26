(function(){
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

  var   service;

  const enableTemp = function(service) {
    const on      = new Uint8Array([0x01]);
    const promise = new Promise( function(resolve,reject) {
      const tempEnableC = service.getCharacteristic(tempEnableAddr);
      tempEnableC.then(function(characteristic){
        characteristic.writeValue(on)
        .then(function() {
          console.log("temp reading enabled...");
          resolve(service);
        })
        .catch(function(err) { reject(err); });
      });
    });
    return promise;
  };

  const readTemps = function(byteArray) {
    var objLSB = byteArray.getUint8(0);
    var objMSB = byteArray.getUint8(1);

    var ambientLSB = byteArray.getUint8(2);
    var ambientMSB = byteArray.getUint8(3);

    var object  = objMSB << 8 | objLSB
    var ambient = ambientMSB << 8 | ambientLSB

    $("#ambientTemp > .value").text(ambient);
    $("#objectTemp > .value").text(object);
  };

  const connect = function() {
    let request = navigator.bluetooth.requestDevice({
      filters: [{ services: [tagIdentifier] }],
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
    .then(function(service) {
      return enableTemp(service)
    })
    .then(function(service){
      console.log("getting Temp Value address....")
      return service.getCharacteristic(tempValueAddr);
    })
    .then(function(characteristic){
      console.log("Reading Temp Value ....")
      const takeReading = function() {
        var vc = characteristic.readValue();
        vc.then(readTemps);
      };
      setInterval(takeReading,600);
    })

    .catch(function(error) {
     console.error('Connection failed!', error);
    });
  };
  $('#connect').click(connect);
})();