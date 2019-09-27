import { ObservableArray } from "data/observable-array"
import { allergens } from "../../shared/allergens"
import { Allergen } from "./Allergen";

/**
 * returns an Observable array of a full list of allergens
 */
export function getFullList(): ObservableArray<Allergen> {
    let list = new ObservableArray<Allergen>();

    for (let alle in allergens) {
        list.push({ name: allergens[alle] })
    }

    return list;
}

/**
 * parse ObservableArray into a single string consisting of allergen values separated by
 * character "-".
 * @param list ObservableArray contaning Allergen
 * @returns string, "" if no allergens in array
 */
export function toString(list: ObservableArray<Allergen>): string {
    let str = "";
    for (var i = 0; i < list.length; i++) {
        str = str.concat(list.getItem(i).name.concat("-"));
    }
    return str.slice(0, str.length - 1);
}

/**
* get the index of an allergen in the ObservableArray allergenList. returns -1 if item can't be found
* @param list: ObservableArray<Allergen> the array to search for an particular item
* @param item an item that is present in the array
* @return index: integer index of the ob in the array.
*/
export function getIndex(list: ObservableArray<Allergen>, item: string): number;
export function getIndex(list: ObservableArray<Allergen>, item: Allergen): number;
export function getIndex(list, item): number {
    if (item instanceof Allergen) {
        item = item.name;
    } else if (typeof item == "string") {
        item = item;
    }

    for (var i = 0; i < list.length; i++) {
        if (list.getItem(i).name == item.name) {
            return i;
        }
    }
    return -1;

}