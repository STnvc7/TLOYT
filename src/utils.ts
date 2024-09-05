export function confirmPromise(message: string) {
  return new Promise((resolve, reject) => {
    const result = confirm(message);
    if (result) {
      resolve(true); // ユーザーが「OK」をクリックした場合
    } else {
      resolve(false); // ユーザーが「キャンセル」をクリックした場合
    }
  });
}
