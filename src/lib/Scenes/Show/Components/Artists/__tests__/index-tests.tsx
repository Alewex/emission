import React from "react"
import "react-native"
import * as renderer from "react-test-renderer"
import { Artists } from "../index"

it("looks correct when rendererd", () => {
  const comp = renderer.create(<Artists artists={[]} />)
  expect(comp).toMatchSnapshot()
})
