import { LightningElement, wire, api } from 'lwc';
import getSimilarBoats from '@salesforce/apex/BoatDataService.getSimilarBoats';
import { NavigationMixin } from 'lightning/navigation';

const BOAT_OBJECT = 'Boat__c';

export default class SimilarBoats extends NavigationMixin(LightningElement) {
  // Private
  relatedBoats;
  boatId;
  error;

  // public
  @api get recordId() {
    return this.boatId;
  }

  set recordId(value) {
    this.setAttribute('boatId', value);
    this.boatId = value;
  }

  // public
  @api similarBy;

  // Wire custom Apex call, using the import named getSimilarBoats
  // Populates the relatedBoats list
  @wire(getSimilarBoats, { boatId: '$boatId', similarBy: '$similarBy' })
  similarBoats({ error, data }) {
    if (data) {
      this.error = undefined;
      this.relatedBoats = data;
    } else {
      this.error = error;
      this.relatedBoats = undefined;
    }
  }

  get getTitle() {
    return 'Similar boats by ' + this.similarBy;
  }
  get noBoats() {
    return !(this.relatedBoats && this.relatedBoats.length > 0);
  }

  // Navigate to record page
  openBoatDetailPage(event) {
    this[NavigationMixin.Navigate]({
      type: 'standard__recordPage',
      attributes: {
        recordId: event.detail.boatId,
        objectApiName: BOAT_OBJECT,
        actionName: 'view'
      },
    });
  }
}
