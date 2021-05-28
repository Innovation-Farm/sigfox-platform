import { browser, by, element } from 'protractor';

export class ConnectorsPage {

  open() {
    return browser.get('/#/connectors');
  }

  addWebhook(name: string, url: string) {
    element(by.css('.card-header i.fa-plus-circle')).click();
    browser.sleep(1000);
            
    // input name
    element(by.name('connectorToAdd.name')).sendKeys(name);

    // select type
    browser.sleep(1000);
    element(by.css('.selected-list')).click();
    browser.sleep(1000);
    element.all(by.css('.lazyContainer > li')).get(2).click();

    // input url
    element(by.xpath('//input[@name="connectorToAdd.url"]')).sendKeys(url);
    element.all(by.xpath('//select[@name="connectorToAdd.method"]/option')).first().click();
    element(by.xpath('//button[@type="submit"]')).click();
  }

  login(email: string, password: string) {
    element(by.name('email')).sendKeys(email);
    element(by.name('password')).sendKeys(password);
    return element(by.xpath("//button[@type='submit']")).click();
  }

}
