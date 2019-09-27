import observable = require("data/observable");
import pages = require("ui/page");
import UserViewModel = require("../../shared/view-models/user-view-model");
import frameModule = require("ui/frame");
import dialogsModule = require("ui/dialogs");
import applicationSettings = require("application-settings");
import { TextField } from "ui/text-field";
import { BindingOptions } from "tns-core-modules/ui/core/bindable";
import config = require("../../shared/config");

let page: pages.Page;
let pageBindings;

export function loaded(args: any) {
    page = <pages.Page>args.object;

    pageBindings = observable.fromObject(
        {
            barcode: ""
        }
    );

    page.bindingContext = pageBindings;

}

export function addCode() {

    console.log(pageBindings.barcode);

    dialogsModule.confirm(pageBindings.barcode)
        .then(function () {
            let navigationEntry;

            // if user is supplier go to product input screen with entered barcode
            // if user is outlet view product info of entered barcode on product info screen
            if (config.userType == "sup" || config.userType == "out") {
                navigationEntry = {
                    moduleName: "views/product-info-input/product-info-input",
                    context: {
                        info: pageBindings.barcode
                    },
                    animated: true
                }
            } 
            else {
                dialogsModule.alert({
                    message: "We can't obtain the correct authorization informtion of your account, please try re-login",
                    okButtonText: "OK"
                });
            }
            frameModule.topmost().navigate(navigationEntry);
        });


}
