export function ArrayClone(arr: any[]): any[] {
	const length = arr.length;
	const newArr = new Array(length);

	for (let i = 0; i < length; i++) {
		newArr[i] = arr[i];
	}
	return newArr;
}
