import { withMiddleware } from "../src"

describe("withMiddleware", () => {
  it("should be a function", () => {
    expect(withMiddleware).toBeInstanceOf(Function)
  })
})
