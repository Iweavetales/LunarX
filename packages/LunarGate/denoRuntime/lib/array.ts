export function ArrayClone(arr: any[]): any[] {
	let length = arr.length;
	let newArr = new Array(length);

	for (let i = 0; i < length; i++) {
		newArr[i] = arr[i];
	}
	return newArr;
}
