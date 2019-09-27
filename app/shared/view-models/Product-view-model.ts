import config = require("../../shared/config");
import { allergens } from "../../shared/allergens";
import fetchModule = require("fetch");
import { ObservableArray } from "data/observable-array"
import observableModule = require("data/observable");
import AllergenListModule = require("../custom-modules/AllergenList");
import { Allergen } from "../custom-modules/Allergen";

// remove newline from string
//.replace(/(\r\n\t|\n|\r\t)/gm,"");

interface viewModel {
    addToPantry: () => Promise<any>;
    supplierUpload: () => Promise<any>;
    getProductInfo: () => Promise<any>;
    name: string;
    productCode: string;
    barcode: string;
    manufacturer: string;
    distributer: string;
    calories: string;
    description: string;
    allergens: string;
}
/**
 * returns a viewmodel containing product info passed in and functions 
 * relating to the product
 * @param info product info object
 * @returns viewModel
 */
function ProductViewModel(info: observableModule.Observable) {

    let model: viewModel = {
        addToPantry: function (): any { },
        supplierUpload: function (): any { },
        getProductInfo: function (): any { },
        name: info.get("name"),
        productCode: info.get("productCode"),
        barcode: info.get("barcode"),
        manufacturer: info.get("manufacturer"),
        distributer: info.get("distributer"),
        calories: info.get("calories"),
        description: info.get("description"),
        allergens: info.get("allergens")
    };

    /**
     * adds the product from database to pantry through endpoint.
     * @returns Promise
     */

    model.addToPantry = function (): Promise<any> {
        let form = new FormData();

        form.append("auth", config.authToken);
        form.append("barcode", this.barcode);

        console.log(form);

        return fetchModule.fetch(config.addToPantryUrl, {
            method: "POST",
            body: form
        })
            .then(handleErrors)
            .then(function (response) {
                console.log(JSON.stringify(response));
                return response.json();
            })
            .then(function (data) {
                if (data.response != "Item saved to pantry") {
                    throw Error("Failed to add to pantry");
                }
            });

    }

    /**
     * adds the product to database.
     * @returns Promise
     */

    model.supplierUpload = function (): Promise<any> {

        let form = new FormData();

        form.append("auth", config.authToken);
        form.append("pc", this.productCode);
        form.append("desc", this.description);
        form.append("prod", this.manufacturer);
        form.append("barcode", this.barcode);
        form.append("cal", this.calories);
        form.append("allergens", AllergenListModule.toString(this.allergens));

        console.log(form);
        return fetchModule.fetch(config.addSupplierUrl, {
            method: "POST",
            body: form
        })
            .then(handleErrors)
            .then(function (response) {
                console.log(JSON.stringify(response));
                return response.json();
            })
            .then(function (data) {
                if (data != "response:success") {
                    throw Error("Failed to upload to database");
                }
            });

    }

    /**
     * gets product information from database and process it to retrun an
     * object containing product information in the desired formate to the calling
     * function
     * @returns Promise
     * @returns Object
     */

    model.getProductInfo = function (): Promise<any> {
        console.log(config.getProUrl + "auth=" + config.authToken + "&barcode=" + this.barcode);

        return fetchModule.fetch(config.getProUrl + "auth=" + config.authToken + "&barcode=" + this.barcode)
            .then(handleErrors)
            .then(function (response) {
                console.log(JSON.stringify(response));
                return response.json();
            })
            .then(function (data) {
                if (data.response.error != undefined) {
                    throw Error("The product can not be found in database");
                } else {

                    /**
                     * when product info was successfully obtained, the response is parsed
                     * to produce an info object which is returned to calling function.
                     */
                    let result = data.response.respose;
                    let list = new ObservableArray<Allergen>();
                    /**
                     * checks for boolean status of the properties in the response object
                     * each property has been mapped in allergens enum which contains a value
                     * in the valid string format corresponding to the required format of the endpoints
                     * only allergens in listed in the allergen enum will be able to add ti the list
                     * thus, un-known allergens and other boolean properties such as 'live'(the only
                     * boolean property other than allergens in the response so far), will not be considered,
                     * i.e. ignored.
                     */
                    for (let key in result) {
                        if (result[key] == true) {
                            if (allergens[key] != undefined) {
                                list.push({ name: allergens[key] })
                            }
                        }
                    }

                    let info = {
                        name: "",
                        productCode: result.product_code,
                        barcode: result.barcode_id,
                        manufacturer: result.producer,
                        distributer: "",
                        calories: result.cal,
                        description: result.description,
                        allergens: list
                    }

                    return info;
                }
            });
    }

    return model;
}

/**
 * generates custom header
 * @returns Header: {}
 */
function getHeaders(): object {
    return {
        "Content-Type": "application/json",
    }
}
/**
 * handels HTTP errors
 * @param response 
 * @returns response
 * @throws Error
 */
function handleErrors(response) {
    if (!response.ok) {
        console.log(JSON.stringify(response));
        throw Error(response.statusText);
    }
    return response;
}

export = ProductViewModel;