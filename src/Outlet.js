const mqtt = require('mqtt');

let Service = null;
let Characteristic = null;


class Outlet {
  constructor(log, config) {
    this.on = false;
    //set date of last message in the past
    this.lastUpdate = Date.now() - 500;
    this.switchService = new Service.Outlet('Ikea Outlet');

    this.config = config;
    this.getServices = this.getServices.bind(this);
    this.updateOn = this.updateOn.bind(this);
    this.onMessage = this.onMessage.bind(this);

    this.mqttConnection = mqtt.connect(config.server);
    this.mqttConnection.subscribe(config.topic);
    this.mqttConnection.on('message', this.onMessage);

  }

  getServices() {
    const informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, 'Ikea')
      .setCharacteristic(Characteristic.Model, 'Power outlet')
      .setCharacteristic(Characteristic.SerialNumber, '123-456-789');
    this.switchService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getOnCharacteristic.bind(this))
      .on('set', this.setOnCharacteristic.bind(this));

    return [informationService, this.switchService];
  }

  getOnCharacteristic(callback) {
    return callback(null, this.isOn);
  }

  setOnCharacteristic(value, callback) {
    this.isOn = value;
    const state = this.isOn ? 'ON' : 'OFF';
    this.mqttConnection.publish(`${this.config.topic}/set`, `{"state": "${state}"}`);

    return callback(null);
  }

  onMessage(topic, message) {
    const currentTime = Date.now();
    if (currentTime - this.lastUpdate < 500) {
      this.lastUpdate = currentTime;
      return;
    }
    const jsonMessage = JSON.parse(message);

    this.updateOn(jsonMessage.state);
  }

  updateOn(ikeaState) {
    this.on = ikeaState === 'ON';
    this.switchService.getCharacteristic(Characteristic.On).updateValue(this.on);
  }
}

function exported(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-mqttIkea-lighbulb', 'IkeaOutlet', Outlet);
}

module.exports = exported;
