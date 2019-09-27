import config = require("../../shared/config");
import fetchModule = require("fetch");
import observableModule = require("data/observable");
import { AndroidActionBarSettings } from "tns-core-modules/ui/action-bar/action-bar";

interface viewModel {
    login: () => Promise<any>;
    username: string;
    password: string;
}

/**
 * creates a viewModel object and returns it
 * @param info: observable object containing username and password
 * @return viewModel: Object with login function and userinfo Observable object
 */
function User(info: observableModule.Observable) {

    let model: viewModel = {
        login: function (): any { },
        username: info.get("username") || "",
        password: info.get("password") || ""
    }

    /**
     * querys Auth API through HTTP POST with username and password as body of message.
     * handels HTTP errors and logs them. Auth token is expected from successful request
     * and stores token is obtained.
     * @return response: response of HTTP request
     */
    model.login = function (): Promise<any> {

        return fetchModule.fetch(config.authUrl, {
            method: "POST",
            body: JSON.stringify({
                "username": model.username,
                "password": model.password
            }),
            headers: getHeaders()
        })
            .then(handleErrors)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                config.authToken = data.token;
                console.log("retrieved token = " + config.authToken);

                return fetchModule.fetch(config.userDiffUrl + config.authToken)
                    .then(handleErrors)
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (typeData) {
                        if (typeData.response.user_type == undefined) {
                            throw TypeError("unable to obtain user type information, please try login again");
                        }
                        config.userType = typeData.response.user_type;
                        console.log("userType = " + config.userType);
                    })
            })
    };

    return model;
}

/** 
 * @return Header: Object with header information.
*/
function getHeaders(): object {
    return {
        "Content-Type": "application/json"
    }
}
/**
 * handles errors from HTTP request
 * @param response: respose from HTTP POST
 * @throws Error: Error 
 * @return response: HTTP response
 */
function handleErrors(response) {
    if (!response.ok) {
        console.log("smthins wrong" + JSON.stringify(response));
        throw Error(response.statusText);
    }
    return response;
}

export = User;