import observable = require("data/observable");
import pages = require("ui/page");
import UserViewModel = require("../../shared/view-models/user-view-model");
import frameModule = require("ui/frame");
import dialogsModule = require("ui/dialogs");
import applicationSettings = require("application-settings");
import BarcodeScanner = require("nativescript-barcodescanner");
import config = require("../../shared/config");


let page: pages.Page;
let pageBindings;

export function loaded(args: any) {
	page = <pages.Page>args.object;
}

export function scanBarcode(args: observable.EventData) {
	let barcodeScanner = new BarcodeScanner.BarcodeScanner();
	// scan a barcode
	barcodeScanner.scan({
		closeCallback: () => { console.log("Scanner closed") },
		orientation: "landscape"
	}).then((result) => {
		// Note that this Promise is never invoked when a 'continuousScanCallback' function is provided
		console.log(result.text);
    // if supplier go to product input screen with scanned barcode
		let navigationEntry;
		if (config.userType == "sup" || config.userType == "out") {
			navigationEntry = {
				moduleName: "views/product-info-input/product-info-input",
				context: {
					info: result.text
				},
				animated: true
			}
		} else {
			dialogsModule.alert({
				message: "We can't obtain the correct authorization informtion of your account, please try re-login",
				okButtonText: "OK"
			});
		}
		frameModule.topmost().navigate(navigationEntry);

	}, (errorMessage) => {
		console.log("No scan. " + errorMessage);
	}
	);
}
// go to input barcode screen
export function inputBarcode(args: observable.EventData) {
	frameModule.topmost().navigate("views/barcode-input/barcode-input");
}
