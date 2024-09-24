import { LightningElement, api, wire } from 'lwc';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import updateBoatList from '@salesforce/apex/BoatDataService.updateBoatList';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { publish, MessageContext } from 'lightning/messageService';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import { refreshApex } from '@salesforce/apex';

const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT = 'Ship it!';
const SUCCESS_VARIANT = 'success';
const ERROR_TITLE = 'Error';
const ERROR_VARIANT = 'error';

import NAME_FIELD from '@salesforce/schema/Boat__c.Name';
import LENGHT_FIELD from '@salesforce/schema/Boat__c.Length__c';
import PRICE_FIELD from '@salesforce/schema/Boat__c.Price__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Boat__c.Description__c';
import CONTACT_FIELD from '@salesforce/schema/Boat__c.Contact__r.Name';
import BOAT_TYPE_FIELD from '@salesforce/schema/Boat__c.BoatType__r.Name';
const BOAT_FIELDS = [NAME_FIELD, LENGHT_FIELD, PRICE_FIELD, DESCRIPTION_FIELD, CONTACT_FIELD, BOAT_TYPE_FIELD];

export default class BoatSearchResults extends LightningElement {
  selectedBoatId;
  columns = [];
  boatTypeId = '';
  boats;
  isLoading = false;
  error = undefined;
  draftValues = [];

  @wire(MessageContext)
  messageContext;
  @wire(getBoats, { boatTypeId: '$boatTypeId', fields: BOAT_FIELDS })
  wiredBoats(result) {
    if (result.data) {
      this.boats = result.data;
      const columnFields = [
        { label: 'Name', fieldName: NAME_FIELD.fieldApiName, editable: true },
        { label: 'Length', fieldName: LENGHT_FIELD.fieldApiName, type: 'number' },
        { label: 'Price', fieldName: PRICE_FIELD.fieldApiName, type: 'currency' },
        { label: 'Description', fieldName: DESCRIPTION_FIELD.fieldApiName }
      ]
      this.columns = columnFields;
      this.error = undefined;
    } else if (result.error) {
      this.boats = undefined;
      this.error = result.error;
    }
  }

  @api searchBoats(boatTypeId) {
    this.isLoading = true;
    this.notifyLoading(this.isLoading);
    this.boatTypeId = boatTypeId;
  }

  @api async refresh() {
    this.isLoading = true;
    this.notifyLoading(this.isLoading);
    await refreshApex(this.boats);
    this.isLoading = false;
    this.notifyLoading(this.isLoading);
  }

  updateSelectedTile(event) {
    this.selectedBoatId = event.detail.boatId;
    this.sendMessageService(this.selectedBoatId);
  }

  sendMessageService(boatId) {
    const payload = { recordId: boatId };
    publish(this.messageContext, BOATMC, payload);
  }

  handleSave(event) {
    const updatedFields = event.detail.draftValues;
    updateBoatList({ data: updatedFields })
      .then(() => {
        this.showToast(SUCCESS_TITLE, MESSAGE_SHIP_IT, SUCCESS_VARIANT);
        this.draftValues = [];
        return this.refresh();
      })
      .catch(error => {
        this.showToast(ERROR_TITLE, error.body.message || 'Failed to save changes', ERROR_VARIANT);
      });
  }

  showToast(title, message, variant) {
    const evt = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant,
    });
    this.dispatchEvent(evt);
  }

  notifyLoading(isLoading) {
    const loadingEvent = new CustomEvent(isLoading ? 'loading' : 'doneloading');
    this.dispatchEvent(loadingEvent);
  }
}
