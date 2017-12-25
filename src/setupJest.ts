import Enzyme from "enzyme"
import Adapter from "enzyme-adapter-react-16"
import expect from "expect"

Enzyme.configure({ adapter: new Adapter() })

// Waiting on https://github.com/thymikee/snapshot-diff/pull/17
import diff from "snapshot-diff"
expect.extend({ toMatchDiffSnapshot: (diff as any).toMatchDiffSnapshot })

const originalConsoleError = console.error

// Remove on the next React-Native update.
console.error = (message?: any) => {
  if (
    typeof message === "string" &&
    (message.includes("PropTypes has been moved to a separate package.") ||
      message.includes("React.createClass is no longer supported.") ||
      message.includes("Check the render method of `ScrollViewMock`. It was passed a child from ListViewMock.") ||
      message.includes("setState(...): Can only update a mounted or mounting component."))
  ) {
    // NOOP
  } else {
    originalConsoleError(message)
  }
}

jest.mock("./lib/metaphysics")
jest.mock("react-tracking")

jest.mock("./lib/NativeModules/NotificationsManager", () => ({
  NotificationsManager: {
    addListener: jest.fn(),
  },
}))

function mockedModule(path: string, mockModuleName: string) {
  jest.mock(path, () => mockModuleName)
}

mockedModule("./lib/Components/SwitchView", "SwitchView")
mockedModule("./lib/Components/Spinner", "ARSpinner")
mockedModule("./lib/Components/OpaqueImageView", "AROpaqueImageView")
mockedModule("./lib/Components/ArtworkGrids/InfiniteScrollGrid", "ArtworksGrid")

// Artist tests
mockedModule("./lib/Components/Artist/Shows/index", "Shows")
mockedModule("./lib/Components/Artist/Artworks/index", "Artworks")
mockedModule("./lib/Components/Artist/Header", "Header")
mockedModule("./lib/Components/Artist/About", "About")

// Gene tests
mockedModule("./lib/Components/Gene/Header", "Header")
