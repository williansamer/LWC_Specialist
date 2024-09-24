import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getAllReviews from '@salesforce/apex/BoatDataService.getAllReviews';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

const ERROR_TITLE = 'Error loading reviews'
const ERROR_VARIANT = 'error';

export default class BoatReviews extends NavigationMixin(LightningElement) {
  // Private
  @api boatId;
  error;
  boatReviews;
  isLoading;

  // Getter and Setter to allow for logic to run on recordId change
  get recordId() {
    return this.boatId;
  }
  @api set recordId(value) {
    this.setAttribute('boatId', value);
    this.boatId = value;
    this.getReviews();
  }

  // Getter to determine if there are reviews to display
  get reviewsToShow() {
    return this.boatReviews !== undefined && this.boatReviews != null && this.boatReviews.length > 0;
  }

  // Public method to force a refresh of the reviews invoking getReviews
  @api refresh() {
    this.getReviews();
  }

  // Imperative Apex call to get reviews for given boat
  // returns immediately if boatId is empty or null
  // sets isLoading to true during the process and false when it’s completed
  // Gets all the boatReviews from the result, checking for errors.
  getReviews() {
    if (this.boatId) {
      this.isLoading = true;
      getAllReviews({ boatId: this.boatId })
        .then((data) => {
          this.error = undefined;
          this.isLoading = false;
          this.boatReviews = data;
        })
        .catch((error) => {
          this.isLoading = false;
          const evt = new ShowToastEvent({
            title: ERROR_TITLE,
            message: error.message,
            variant: ERROR_VARIANT,
          });
          this.dispatchEvent(evt);
        })
    } else {
      return;
    }
  }

  // Helper method to use NavigationMixin to navigate to a given record on click
  navigateToRecord(event) {
    event.preventDefault();
    event.stopPropagation();
    const createdById = event.target.dataset.recordId;

    this[NavigationMixin.Navigate]({
      type: 'standard__recordPage',
      attributes: {
        recordId: createdById,
        objectApiName: 'User',
        actionName: 'view',
      },
    });
  }
}
