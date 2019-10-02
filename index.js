
const mqtt = require('mqtt');

let Service = null;
let Characteristic = null;

class LightBulb {
  constructor(log, config) {
    // set it in ast we will be receiving our first message soon
    this.ikeaColorTempRange = { min: 250, max: 454 };
    this.homekitColorTempRange = { min: 140, max: 499 };

    this.switchService = new Service.Lightbulb('Ikea lightbulb');
    this.lastUpdate = Date.now() - 500;
    this.config = config;
    this.mqttConnection = mqtt.connect(config.server);
    this.mqttConnection.subscribe(config.topic);

    this.on = false;
    this.brightnessPercentage = 0;
    this.colorTemperature = 0;

    this.getServices = this.getServices.bind(this);
    this.updateBrightness = this.updateBrightness.bind(this);
    this.updategetColorTemperature = this.updateColorTemperature.bind(this);
    this.updateOn = this.updateOn.bind(this);
    this.onMessage = this.onMessage.bind(this);

    this.mqttConnection.on('message', this.onMessage);
  }

  convertRangeValueToPercentage(range, value) {
    const { min, max } = range;
    return (value - min) / (max - min);
  }

  onMessage(topic, message) {
    const currentTime = Date.now();
    if (currentTime - this.lastUpdate < 500) {
      this.lastUpdate = currentTime;
      return;
    }
    const jsonMessage = JSON.parse(message);

    this.updateOn(jsonMessage.state);
    this.updateBrightness(jsonMessage.brightness);
    this.updateColorTemperature(jsonMessage.color_temp);

    this.lastUpdate = currentTime;
  }

  updateBrightness(ikeaBrightness) {
    this.brightnessPercentage = (ikeaBrightness / 255) * 100;
    this.switchService.getCharacteristic(Characteristic.Brightness)
      .updateValue(this.brightnessPercentage);
  }

  updateOn(ikeaState) {
    this.on = ikeaState === 'ON';
    this.switchService.getCharacteristic(Characteristic.On).updateValue(this.on);
  }

  updateColorTemperature(ikeaColorTemperature) {
    const percentage = this.convertRangeValueToPercentage(
      this.ikeaColorTempRange,
      ikeaColorTemperature
     );
    const { min, max } = this.homekitColorTempRange;
    this.colorTemperature = percentage * (max - min) + min;
    this.switchService.getCharacteristic(Characteristic.ColorTemperature)
      .updateValue(this.colorTemperature);
  }

  getServices() {
    const informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, 'Ikea')
      .setCharacteristic(Characteristic.Model, 'Dimmable lightbulb')
      .setCharacteristic(Characteristic.SerialNumber, '123-456-789');
    this.switchService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getSwitchOnCharacteristic.bind(this))
      .on('set', this.setSwitchOnCharacteristic.bind(this));
    this.switchService
      .getCharacteristic(Characteristic.Brightness)
      .on('get', this.getBrightness.bind(this))
      .on('set', this.setBrightness.bind(this));

    this.switchService
      .getCharacteristic(Characteristic.ColorTemperature)
      .on('get', this.getColorTemperature.bind(this))
      .on('set', this.setColorTemperature.bind(this));
    this.informationService = informationService;

    return [informationService, this.switchService];
  }

  getSwitchOnCharacteristic(callback) {
    return callback(null, this.isOn);
  }

  setSwitchOnCharacteristic(value, callback) {
    this.isOn = value;
    const state = this.isOn ? 'ON' : 'OFF';
    this.mqttConnection.publish(`${this.config.topic}/set`, `{"state": "${state}"}`);

    return callback(null);
  }

  getBrightness(callback) {
    return callback(null, this.brightnessPercentage);
  }

  setBrightness(value, callback) {
    this.brightnessPercentage = value;
    const ikeaBrightness = (value / 100) * 255;
    this.mqttConnection.publish(`${this.config.topic}/set`, `{"brightness": "${ikeaBrightness}"}`);

    return callback(null);
  }

  getColorTemperature(callback) {
    return callback(null, this.colorTemperature);
  }

  setColorTemperature(value, callback) {
    const percentage = this.convertRangeValueToPercentage(
      this.homekitColorTempRange,
      value
    );
    const { min, max } = this.ikeaColorTempRange;
    const ikeaColorTemperature = percentage * (max - min) + min;
    this.mqttConnection.publish(`${this.config.topic}/set`, `{"color_temp": "${ikeaColorTemperature}"}`);

    callback(null);
  }
}

function exported(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-switch-plugin', 'MyAwesomeSwitch', LightBulb);
}

module.exports = exported;
