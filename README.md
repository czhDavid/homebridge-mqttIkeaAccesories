# homebridge-mqttIkeaAccesories
Integration of  [zigbee2mqtt](https://github.com/Koenkk/zigbee2mqtt.io) and homebridge for Ikea lightbulbs.
Currently only Ikea TRADFRI LED1545G12 is supported. Other models might work but with no guarantee.
# Instalation
```
npm i -g homebridge-mqtt-ikea-accesories
```


## configuration
There are only two parameters that are needed.
First is *server* with address of the MQTT server and second one is a *topic* which contains state of the accessory.
In this case it is mqtt://raspberrypi.local:1883 and zigbee2mqtt/Livingroombulb
```
{
  "bridge": {
    "name": "Homebridge test",
    "username": "CC:22:3D:E3:CE:31",
    "port": 51826,
    "pin": "031-45-155"
  },

  "description": "This is a basic setup for one Ikea lightbulb.",
  "ports": {
    "start": 52100,
    "end": 52150,
    "comment": "This section is used to control the range of ports that separate accessory (like camera or television) should be bind to."
  },
  "accessories": [
    {
      "accessory": "IkeaLightbulb",
      "name": "Lvingroom Lightbuld",
      "server": "mqtt://raspberrypi.local:1883",
      "topic": "zigbee2mqtt/Livingroombulb"
    }
  ],

  "platforms": [
  ]
}
```
