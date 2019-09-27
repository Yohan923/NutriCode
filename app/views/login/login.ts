import observable = require("data/observable");
import config = require("../../shared/config");
import pages = require("ui/page");
import UserViewModel = require("../../shared/view-models/user-view-model");
import frameModule = require("ui/frame");
import dialogsModule = require("ui/dialogs");
import applicationSettings = require("application-settings");
import { LoadingIndicator } from "nativescript-loading-indicator";
import { TextField } from "ui/text-field";

let page: pages.Page;
let pageBindings;
let loader = new LoadingIndicator();
let loaderOptions = {
    message: 'Logging in...',
}

/**
 * initialises page object and sets its bindings.
 * username is set to the stored value or empty string
 * initialises userType to ""
 * @param args: the page viewModel
 */
export function loaded(args: any) {
    page = <pages.Page>args.object;

    config.userType = "";

    pageBindings = observable.fromObject({
        username: applicationSettings.getString("username", ""),
        password: ""
    });

    page.bindingContext = pageBindings;
}

/**
 * pagebindings containing username and password is passed to usermodel's login function for
 * authentication. catch and handle any errors and if no errors are encountered.
 * If login is successful, navigate to appropriate page and save username for future use.
 */
export function signIn() {

    loader.show(loaderOptions);

    let user = UserViewModel(pageBindings);
    user.login()
        .catch(function (error) {
            loader.hide();
            let errorMessage;
            if (error instanceof TypeError) {
                errorMessage = error.message;
            } else {
                errorMessage = "Invalid Username or Password";
            }

            dialogsModule.alert({
                message: errorMessage,
                okButtonText: "OK"
            });

            return Promise.reject(error);
        })
        .then(function () {
            applicationSettings.setString("username", pageBindings.get("username"));
            loader.hide();
            frameModule.topmost().navigate("views/menu/menu");
        });
}

/**
 * blurs textfields
 */
export function blurTextField() {
    let field = <TextField> page.getViewById("username");
    field.dismissSoftInput();
    field = <TextField> page.getViewById("password");
    field.dismissSoftInput();
}