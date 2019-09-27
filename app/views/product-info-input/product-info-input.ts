import observable = require("data/observable");
import config = require("../../shared/config");
import pages = require("ui/page");
import ProductViewModel = require("../../shared/view-models/Product-view-model");
import dialogsModule = require("ui/dialogs");
import { ObservableArray } from "data/observable-array"
import frameModule = require("ui/frame");
import { Button } from "ui/button";
import { TextView } from "ui/text-view";
import { isIOS } from "platform"
import { isAndroid } from "platform"
import { LoadingIndicator } from "nativescript-loading-indicator";
import AllergenListModule = require("../../shared/custom-modules/AllergenList");
import { Allergen } from "../../shared/custom-modules/Allergen";
import { CheckBox } from 'nativescript-checkbox';

let page: pages.Page;
let pageBindings;
let listView;
let lastFocused;
let loader = new LoadingIndicator();
let loaderOptions = {
	message: 'Uploading',
}

/**
 * called when page has loaded, tries to get product information from endpoint.
 * if it fails, the page will be initialised with empty bindings except barcode
 * where it would be the value passed in. otherwise the page display information
 * from database
 * @param args
 */
export function loaded(args: any) {
	page = <pages.Page>args.object;

	let uploadButton = <Button>page.getViewById("uploadBut");

	if(config.userType == "out"){
		uploadButton.text = "Add To Pantry"
	}else if(config.userType == "sup"){
		uploadButton.text = "Upload To Database"
	}else{
		dialogsModule.alert({
			message: "an error has occured, please re-login",
			okButtonText: "OK"
		});
		return;
	}

	let product = {
		name: "",
		productCode: "",
		barcode: page.navigationContext.info,
		manufacturer: "",
		distributer: "",
		calories: "",
		description: "",
		allergens: new ObservableArray<Allergen>()
	}

	let productView = ProductViewModel(observable.fromObject(product));

	productView.getProductInfo().catch(function (error) {
		dialogsModule.alert({
			message: error.message,
			okButtonText: "OK"
		});
		pageBindings = observable.fromObject(product);
		page.bindingContext = pageBindings;
		return Promise.reject(error);
	})
		.then(function (data) {
			pageBindings = observable.fromObject(data);
			page.bindingContext = pageBindings;
		});
}

/**
 * By pressing the button which calls this function, textview that is currently
 * focused will be blured(ie. keyboard and text infdicator will be dismissed.).
 * The integrety and completeness of data is checked before upload.
 * 
 * Makes contact with api through functions in Product-View-Model. suplier will upload the 
 * product to the database. while an outlet will add product to pantry
 * @param args 
 */
export function upload(args: any) {
	blurTextView();

	//changes to allergens must be confirmed before upload
	let button = <Button>page.getViewById("allergMod");
	if (button.text == "Confirm") {
		dialogsModule.alert({
			message: "Please confirm allergen changes first",
			okButtonText: "OK"
		})
		return;
	}
	//user must enter in at least one of manufacturer or distributer
	if (pageBindings.get("manufacturer").trim() == "" && pageBindings.get("distributer").trim() == ""){
		dialogsModule.alert({
			message: "Please enter at least one of the fields 'manufacturer' and 'distributer'",
			okButtonText: "OK"
		});
		return;
	}

	//calories information must be entered
	if (pageBindings.get("calories").trim() == ""){
		dialogsModule.alert({
			message: "Please enter a calories value",
			okButtonText: "OK"
		});
		return;
	}

	//user must tick agreement box
	let checkBox = <CheckBox>page.getViewById("checkBox");
	if (!checkBox.checked){
		dialogsModule.alert({
			message: "you must tick the check box",
			okButtonText: "OK"
		});
		return;
	}else{
		config.userAgreedTerms = true;
	}

	let productView = ProductViewModel(pageBindings);
	
	// check if the user is supplier before add product to database
	loader.show(loaderOptions);
	if (config.userType == "sup") {
		productView.supplierUpload()
			.catch(function (error) {
				loader.hide();
				dialogsModule.alert({
					message: error.message,
					okButtonText: "OK"
				});

				return Promise.reject(error);
			})
			.then(function () {
				loader.hide();
				dialogsModule.alert({
					message: "Product successfully uploaded",
					okButtonText: "OK"
				});
			});
	}
	// adds the product to pantry if user is outlet
	else if(config.userType == "out"){
		productView.addToPantry()
		.catch(function (error) {
			loader.hide();
			dialogsModule.alert({
				message: error.message,
				okButtonText: "OK"
			});

			return Promise.reject(error);
		})
		.then(function () {
			loader.hide();
			dialogsModule.alert({
				message: "Product successfully added to pantry",
				okButtonText: "OK"
			});
		});
	}
	// if user is not "sup" or "out", nothing will be done
	else {
		loader.hide();
		dialogsModule.alert({
			message: "an error has occured,try restart the app.",
			okButtonText: "OK"
		});
	}
}

/**
 * Pressing this button will blur existing textview that was focused
 * 
 * Allows user to select or remove allergens from the list of allergens.The functionality
 * of the list changes according to states deternmined by the button text.
 */
export function modify() {
	blurTextView();

	let button = <Button>page.getViewById("allergMod");

	//list in non-editable state, changes to editable state, selection is enabled
	if (button.text == "Add or Remove Allergens") {
		button.text = "Confirm";

		listView = page.getViewById("listView");
		listView.multipleSelection = "true";
		listView.selectionBehavior = "Press"

		/**
		* pageBinding is set the full list of allergens,
		* items that was already in the list is extracted and set to "select" state
		*/
		let selectedItems = pageBindings.get("allergens");
		pageBindings.set("allergens", AllergenListModule.getFullList());
		//setting out list to the full list so we can use getIndex() on it.
		let fullList = pageBindings.get("allergens");

		for (var i = 0; i < selectedItems.length; i++) {
			let index = AllergenListModule.getIndex(fullList,selectedItems.getItem(i));
			if (index >= 0) {
				listView.selectItemAt(index);
			}
		}
	}
	//list in editable-state, changes to non-editable state. selection is disabled.
	else {
		button.text = "Add or Remove Allergens";

		//selected items are extracted, stored in a new list and set to page binding for display
		let items = listView.getSelectedItems();
		pageBindings.set("allergens", new ObservableArray<Allergen>(items));

		listView.multipleSelection = "false";
		listView.selectionBehavior = "None";
	}
}

/**
 * blurs(dismiss keyboard and text indicator) the textview currently in selection
 * changes the size of textview according to the size of its content
 * @param args 
 */
export function onBlur(args: observable.EventData) {
	// blur event will be triggered when the user leaves the TextField
	let sender = <TextView>args.object;
	let name = sender.id;
	let parent = sender.parent;

	if (isIOS) {
		let textview: TextView = <TextView>page.getViewById(name);
		textview.height = textview.ios.contentSize.height;
	} else if (isAndroid) {
		let textview: TextView = <TextView>page.getViewById(name);
		textview.height = textview.android.contentSize.height;
	}
}

/**
 * stores the text view that was last focused it can be blured in the future
 * @param args 
 */
export function onFocus(args: observable.EventData) {
	let sender = <TextView>args.object;
	let name = sender.id;
	lastFocused = <TextView>page.getViewById(name);
}

/**
 * blurs textview that was last focused
 */
export function blurTextView() {
	if (lastFocused != undefined && lastFocused != null) {
		lastFocused.dismissSoftInput();
	}
}