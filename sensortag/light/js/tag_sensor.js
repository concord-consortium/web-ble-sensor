(function(){
  var readIntervalID;

  const ctx = $('#canvas')[0].getContext('2d');
  const deviceConnected = function(server) {
      const disconnect = function() {
        clearInterval(readIntervalID);
        server.disconnect();
        $("#disconnect").hide();
        $("#connect").show();
      };
      $("#disconnect").click(disconnect);
      $("#connect").hide();
      $("#disconnect").show();
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

  const displayLight = function(light) {
    $("#light > .value").text(light);
    drawGraph(light);
  };

  tagIdentifier     = 0xaa80;
  serviceAddr  = 'f000aa70-0451-4000-b000-000000000000';
  valueAddr    = 'f000aa71-0451-4000-b000-000000000000';
  enableAddr   = 'f000aa72-0451-4000-b000-000000000000';

  connect = async function() {
    device =           // Step 1: ask for a device
      await navigator.bluetooth.requestDevice({
        filters: [{ services: [tagIdentifier] }],
        optionalServices: [serviceAddr]
      });
    server =           // Step 2: Connect to device
      await device.gatt.connect();
      deviceConnected(server);
    service =          // Step 3: Get the Service
      await server.getPrimaryService(serviceAddr);
    enableChar =       // Step 4: Enable Light Sensor
      await service.getCharacteristic(enableAddr);
      await enableChar.writeValue(new Uint8Array([0x01]));
    valueChar =        // Step 5: Get light characteristic
      await service.getCharacteristic(valueAddr);
                       // Step 6: Loop every 600ms
    readIntervalID = setInterval(async () => {
      byteArray =      // Step 7: Read bytes
        await valueChar.readValue();
                       // Step 8: display light
      displayLight(byteArray.getUint16(0, true));
    },600);
  };

  $('#connect').click(connect);
})();
