import React from "react"
import _track, { Track as _Track, TrackingInfo } from "react-tracking"

import Events from "lib/NativeModules/Events"

/**
 * Useful notes:
 *  * Add `jest.mock("react-tracking")` to test components
 *    which are wrapped by tracking.
 */

// tslint:disable-next-line:no-namespace
export namespace Schema {
  /**
   * The global tracking-info keys in Artsy’s schema.
   */
  export interface Global {
    /**
     * The name of an event.
     *
     * Options are: Tap, Fail, Success
     *
     * This is unique to a "Track" event, meaning a "screen view" in Segment does not have this
     * This is how we distinguish the two type of events in Eigen
     * Track data inherits the screen view (called "context_screen") properties
     *
     */
    action_type: ActionTypes

    /**
     * The discription of an event
     *
     * E.g. Conversation artwork attachment tapped
     */
    action_name: ActionNames

    /**
     * OPTIONAL: Additional properties of the action
     */
    additional_properties?: object
  }

  export interface Entity extends Global {
    /**
     * The ID of the entity in its database. E.g. the Mongo ID for entities that reside in Gravity.
     */
    owner_id: string

    /**
     * The public slug for this entity.
     */
    owner_slug: string

    /**
     * The type of entity, e.g. Artwork, Artist, etc.
     */
    owner_type: OwnerEntityTypes
  }

  export interface PageView {
    /**
     * The root container component should specify this as the screen context.
     */
    context_screen: PageNames

    /**
     * The public slug for the entity that owns this page (e.g. for the Artist page)
     */
    context_screen_owner_slug?: string

    /**
     * The ID of the entity in its database. E.g. the Mongo ID for entities that reside in Gravity.
     *
     * OPTIONAL: This may not always be available before the relay call for props has been made
     */
    context_screen_owner_id?: string

    /**
     * The type of entity (owner), E.g. Artist, Artwork, etc.
     */
    context_screen_owner_type: OwnerEntityTypes
  }

  export enum PageNames {
    ArtistPage = "Artist",
    ConversationPage = "Conversation",
    ConsignmentsWelcome = "ConsignmentsWelcome",
    ConsignmentsOverView = "ConsignmentsOverview",
    ConsignmentsSubmission = "ConsignmentsSubmit",
    InboxPage = "Inbox",
    InquiryPage = "Inquiry",
  }

  export enum OwnerEntityTypes {
    Artist = "Artist",
    Artwork = "Artwork",
    Conversation = "Conversation",
    Gene = "Gene",
    Show = "Show",
    Invoice = "Invoice",
    Consignment = "ConsignmentSubmission",
  }

  export enum ActionTypes {
    /**
     * User actions
     */
    Tap = "tap",

    /**
     * Events / results
     */
    Fail = "fail",
    Success = "success",
  }

  /**
   * Action event discriptors / names
   */
  export enum ActionNames {
    /**
     * Artist Page Events
     */
    ArtistFollow = "artistFollow",
    ArtistUnfollow = "artistUnfollow",

    /**
     * Conversations / Inbox / Messaging Events
     */
    ConversationSelected = "conversationSelected",
    ConversationSendReply = "conversationSendReply",
    ConversationAttachmentShow = "conversationAttachmentShow",
    ConversationAttachmentArtwork = "conversationAttachmentArtwork",
    ConversationAttachmentInvoice = "conversationAttachmentInvoice",
    ConversationLink = "conversationLinkUsed",
    InquiryCancel = "inquiryCancel",
    InquirySend = "inquirySend",

    /**
     *  Consignment flow
     */
    ConsignmentDraftCreated = "consignmentDraftCreated",
    ConsignmentSubmitted = "consignmentSubmitted",
  }
}

/**
 * Use this interface to augment the `track` function with props, state, or custom tracking-info schema.
 *
 * @example
 *
 *      ```ts
 *      import { Schema, Track, track as _track } from "lib/utils/track"
 *
 *      interface Props {
 *        artist: {
 *          id: string
 *          slug: string
 *        }
 *      }
 *
 *      interface State {
 *        following: boolean
 *      }
 *
 *      const track: Track<Props, State> = _track
 *
 *      @track()
 *      class Artist extends React.Component<Props, State> {
 *        render() {
 *          return (
 *            <div onClick={this.handleFollow.bind(this)}>
 *              ...
 *            </div>
 *          )
 *        }
 *
 *        @track((props, state) => ({
 *          action_type: Schema.ActionTypes.Tap,
 *          action_name: state.following ? Schema.ActionNames.ArtistUnfollow : Schema.ActionNames.ArtistFollow,
 *          owner_id: props.artist._id,
 *          owner_type: Schema.OwnerEntityTypes.Artist,
 *          owner_slug: props.artist.id,
 *        }))
 *        handleFollow() {
 *          // ...
 *        }
 *      }
 *
 *      ```
 */
export interface Track<P = any, S = null, T extends Schema.Global = Schema.Entity> extends _Track<T, P, S> {} // tslint:disable-line:no-empty-interface

/**
 * A typed tracking-info alias of the default react-tracking `track` function.
 *
 * Use this when you don’t use a callback function to generate the tracking-info and only need the global schema.
 *
 * @example
 *
 *      ```ts
 *      import { track } from "lib/utils/track"
 *
 *      @track()
 *      class Artist extends React.Component<{}, null> {
 *        render() {
 *          return (
 *            <div onClick={this.handleFollow.bind(this)}>
 *              ...
 *            </div>
 *          )
 *        }
 *
 *        @track({ action: "Follow Artist" })
 *        handleFollow() {
 *          // ...
 *        }
 *      }
 *      ```
 */
export const track: Track = _track

/**
 * A typed page view decorator for a class, for when you _don't_ need to make tracked calls internally
 *
 * As an object:
 *
 * @example
 *
 *      ```ts
 *      import { pageViewTrack, Schema } from "lib/utils/track"
 *
 *       @pageViewTrack({
 *        context_screen: Schema.PageNames.ConsignmentsWelcome,
 *        context_screen_owner_slug: null,
 *        context_screen_owner_type: Schema.OwnerEntityTypes.Consignment,
 *       })
 *       export default class Welcome extends React.Component<Props, null> {
 *
 *        goTapped = () => this.props.navigator.push({ component: Overview })
 *
 *        // It's not optimal to dismiss the modal, but otherwise we get into all sorts of tricky states
 *        privacyPolicyTapped = () =>
 *          SwitchBoard.dismissModalViewController(this) &&
 *          SwitchBoard.presentNavigationViewController(this, Router.PrivacyPage)
 *         [...]
 *
 * * As an function taking account of incoming props:
 *
 * @example
 *
 *      ```ts
 *      import { pageViewTrack, Schema } from "lib/utils/track"
 *
 *      interface Props extends ViewProperties {
 *        navigator: NavigatorIOS
 *        route: Route
 *        submissionID: string
 *      }
 *
 *      @pageViewTrack<Props>(props => ({
 *        context_screen: Schema.PageNames.ConsignmentsSubmission,
 *        context_screen_owner_slug: props.submissionID,
 *        context_screen_owner_type: Schema.OwnerEntityTypes.Consignment,
 *      }))
 *      export default class Welcome extends React.Component<Props, null> {
 *        goTapped = () => this.props.navigator.push({ component: Overview })
 *
 *        [...]
 *
 */
export function pageViewTrack<P>(trackingInfo: TrackingInfo<Schema.PageView, P, null>) {
  return _track(trackingInfo as any, {
    dispatch: data => Events.postEvent(data),
    dispatchOnMount: true,
  })
}
