# Food safety evidence and scope

Sources checked 4 October 2026. These checks screen recorded evidence. They do not certify food safety, verify a food control plan, assess allergens or replace a trained food handler. CLI operator names are recorded labels, not authenticated signatures.

## Australia

[FSANZ temperature control](https://www.foodstandards.gov.au/business/food-safety/keeping-food-at-the-right-temperature): potentially hazardous food is normally kept at or below 5 C or at or above 60 C. The cold and hot checks compare the measured temperature with the relevant limit. Missing temperatures are explicitly flagged.

[FSANZ two-hour/four-hour guide](https://www.foodstandards.gov.au/business/food-safety/2-hour-4-hour-rule): record the cumulative time refrigerated potentially hazardous food has spent between 5 C and 60 C across preparation, transport and display. Below 120 minutes, review the measured temperature and intended use. From 120 to under 240 minutes, use immediately and do not refrigerate. At 240 minutes or more, discard. Returning food to the fridge does not reset accumulated time. The user must supply the total; the software cannot reconstruct it from isolated observations. Missing exposure is flagged even when the current temperature is within range. Do not apply this guide as the cooking or cooling process.

[FSANZ cooling](https://www.foodstandards.gov.au/business/food-safety/cooling-and-reheating-food): the standard two-stage process cools cooked potentially hazardous food from 60 C to 21 C within 120 minutes, then from 21 C to 5 C within 240 minutes. Record actual measured stage durations in first_cooling_minutes and second_cooling_minutes, and the final temperature. Missing values or exceeded limits are flagged. These fields represent measured threshold crossings, not estimates of fridge time. An approved alternative process requires a customised rule and its supporting evidence.

The base does not implement every Standard 3.2.2A requirement, training records, supervisor certification or a complete food safety program. An apparent within-limit result describes those recorded measurements only.

## New Zealand

[MPI template food control plans](https://www.mpi.govt.nz/food-business/running-a-food-business/food-control-plans/use-a-template-food-control-plan) and [record forms](https://www.mpi.govt.nz/food-business/running-a-food-business/forms-and-documents-for-food-act-plans-and-programmes) explain the applicable plan and its records. NZ entries always return REVIEW AGAINST REGISTERED FOOD CONTROL PLAN. The base never applies the Australian thresholds to NZ entries automatically. Enterprise DNA can implement the procedures in your registered plan after the operator supplies them.

## House policies

Dietary review before a confirmed event, stale enquiries after seven days, unpaid deposits past their due date, missing line costs, and packing gaps are business rules. They are not claimed as statutory deadlines. Allergen text reflects the recorded menu only. Recipe quantities are per portion and ingredient units must already match. No allergen-free guarantee or automatic substitution is made.

Observations and receipts are append-only in the CLI. Corrections go into an event note and a new observation; previous readings remain visible. Direct database administrators can still change records. Shared use requires permissions, identity integration and backups.
