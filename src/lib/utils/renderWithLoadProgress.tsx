import React from "react"
import { ReadyState, RelayContainer } from "react-relay"

import LoadFailureView from "lib/Components/LoadFailureView"
import Spinner from "lib/Components/Spinner"

export default function<P>(
  Container: RelayContainer<P>,
  initialProps: object = {}
): (readyState: ReadyState<P>) => React.ReactElement<RelayContainer<P>> | null {
  let retrying = false
  return ({ error, props, retry }) => {
    if (error) {
      const networkError = error as any
      if (networkError.response && networkError.response._bodyInit) {
        let data = networkError.response._bodyInit || "{}"
        try {
          data = JSON.parse(data)
          // tslint:disable-next-line:no-empty
        } catch (e) {}
        console.error(`Metaphysics Error: ${error.message}\n`, data)
      }

      if (retrying) {
        retrying = false
        // TODO: Even though this code path is reached, the retry button keeps spinning. iirc it _should_ disappear when
        //      `onRetry` on the instance is unset.
        //
        // This will re-use the native view first created in the renderFailure callback, which means it can
        // continue its ‘retry’ animation.
        return <LoadFailureView style={{ flex: 1 }} />
      } else {
        retrying = true
        return <LoadFailureView onRetry={retry} style={{ flex: 1 }} />
      }
    } else if (props) {
      return <Container {...initialProps} {...props as any} />
    } else {
      return <Spinner style={{ flex: 1 }} />
    }
  }
}
