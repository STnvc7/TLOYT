export const convertTestType = (test_type) => {
  switch (test_type) {
    case "Mos":
      return "平均オピニオン評価"
    case "Thurstone":
      return "一対比較法(サーストン法)"
    default:
      return test_type
  }
}