/* @flow */
'use strict'

import Relay from 'react-relay'
import React from 'react'
import { ScrollView, View, Dimensions, StyleSheet } from 'react-native'
import _ from 'lodash'

import ParallaxScrollView from 'react-native-parallax-scroll-view'

import Events from '../native_modules/events'

import Separator from '../components/separator'
import SerifText from '../components/text/serif'
import WhiteButton from '../components/buttons/flat_white'

import About from '../components/gene/about'
import Header from '../components/gene/header'
import Artworks from '../components/gene/artworks'

import SwitchView from '../components/switch_view'
import type SwitchEvent from '../components/events'

import Refine from '../native_modules/refine_callback'
import colors from '../../data/colors'

const isPad = Dimensions.get('window').width > 700

const TABS = {
  WORKS: 'WORKS',
  ABOUT: 'ABOUT',
}

// The title of the gene when scrolled, with margins
const HeaderHeight = 64

  /**
   *  There are 3 different major views inside this componentDidUpdate
   *
   *   - Foreground [title, follow, switch]
   *   - Sticky Refine [work counter, refine]
   *   - Section inside tab [artworks || about + related artists]
   *
   *   Nuance:
   *
   *   - The foreground switches between the "foreground" and "sticky header"
   *     the foreground being the title, buttons and switch, the header being
   *     just the title. It only does this for Artworks, not about.
   *
   *   - The sticky refine, when scrolled up _gains_ a 64px margin
   *     this is so it can reach all the way of the screen, and fit
   *     the sticky header's mini title inside it.
   *
   *   - We use a fork of react-native-parallax-scroll-view which has access
   *     to change the style component of the header, as well as a well-ordered
   *     API for inserting a component into the tree. This is used so that the
   *     sticky refine section will _always_ be at a specific index, making sure
   *     the `stickyHeaderIndices` is always at the right index.
   *
   */

class Gene extends React.Component {

  state: {
    selectedTabIndex: number,
  };

  componentWillMount() {
    this.state = { selectedTabIndex: 0, showingStickyHeader: 1 }
  }

  switchSelectionDidChange = (event: SwitchEvent) => {
    this.setState({ selectedTabIndex: event.nativeEvent.selectedIndex })
  }

  availableTabs = () => {
    return [TABS.WORKS, TABS.ABOUT]
  }

  selectedTabTitle = () => {
    return this.availableTabs()[this.state.selectedTabIndex]
  }

  // This is *not* called on the initial render, thus it will only post events for when the user actually taps a tab.
  // TODO: This was getting called far more than expected.
  // componentDidUpdate(previousProps, previousState) {
  //   Events.postEvent(this, {
  //     name: 'Tapped gene view tab',
  //     tab: this.selectedTabTitle().toLowerCase(),
  //     gene_id: this.props.gene._id,
  //     gene_slug: this.props.gene.id,
  //   })
  // }

  renderSectionForTab = () => {
    switch (this.selectedTabTitle()) {
      case TABS.ABOUT: return <About gene={this.props.gene} />
      case TABS.WORKS: return <Artworks
        gene={this.props.gene}
        stateQuery={this.stateQuery}
        resolveQuery={this.resolveQuery}
      />
    }
  }

  get commonPadding(): number {
    const windowDimensions = Dimensions.get('window')
    return windowDimensions.width > 700 ? 40 : 20
  }

  get showingArtworksSection(): bool {
    return this.selectedTabTitle() === TABS.WORKS
  }

  foregroundHeight(): ?number {
    return 200
  }

  // Top of the Component
  renderForeground = () => {
    return (
      <View style={[{ backgroundColor:'white', paddingLeft: this.commonPadding, paddingRight: this.commonPadding }, styles.header] }>
          <Header gene={this.props.gene} shortForm={false} />
          <SwitchView style={{ marginTop:30 }}
            titles={this.availableTabs()}
            selectedIndex={this.state.selectedTabIndex}
            onSelectionChange={this.switchSelectionDidChange} />
      </View>
    )
  }

  // Callback from the parallax that we have transistioned into the small title mode
  onChangeHeaderVisibility = (sticky) => {
    if (this.state.showingStickyHeader !== sticky) {
      // Set the state so we can change the margins on the refine section
      this.setState({ showingStickyHeader: sticky })
    }
  }

  // No sticky header if you're in the about section
  stickyHeaderHeight(): ?number {
    if (!this.showingArtworksSection) { return null }
    return HeaderHeight
  }

  refineTapped = (button) => {
    Refine.triggerRefine(this, {thing: 'OK'}).then( (newSettings) => {
      console.log('OK, got:')
      console.log(newSettings)
    }).catch( (error) => {
      console.log('Errr : ', error)
    })
  }

  // Title of the Gene
  renderStickyHeader = () => {
    if (!this.showingArtworksSection) { return null }
    const commonPadding = this.commonPadding
    return (
      <View style={{ paddingLeft: commonPadding, paddingRight: commonPadding, backgroundColor: 'white' }}>
        <Header gene={this.props.gene} shortForm={true} />
      </View>
    )
  }

  // Count of the works, and the refine button - sticks to the top of screen when scrolling
  renderStickyRefineSection = () => {
    if (!this.showingArtworksSection) { return null }
    const topMargin = this.state.showingStickyHeader ? 0 : HeaderHeight
    const separatorColor = this.state.showingStickyHeader ? 'white' : colors['gray-regular']

    return (<View style={{ backgroundColor: 'white'}}>
        <Separator style={{marginTop:topMargin, backgroundColor:separatorColor}} />
        <View style={{flexDirection: 'row', justifyContent: 'space-between', height: 26, marginTop:12, marginBottom:12, paddingLeft: this.commonPadding, paddingRight: this.commonPadding }} >
          <SerifText style={{ fontStyle: 'italic', marginTop:4 }}>{ this.artworkQuerySummaryString() }</SerifText>
          {/* <WhiteButton text="REFINE" style={{ height: 26, width: 80, fontSize: 12 }} onPress={this.refineTapped}/> */}
        </View>
        <Separator style={{ backgroundColor:separatorColor }}/>
      </View>)
  }

  render() {
    const stickyTopMargin = this.state.showingStickyHeader ?  0 : -HeaderHeight

    return (
      <ParallaxScrollView
        scrollsToTop={true}
        fadeOutForeground={false}
        backgroundScrollSpeed={1}

        backgroundColor="white"
        contentBackgroundColor="white"
        renderForeground={this.renderForeground}

        stickyHeaderHeight={this.stickyHeaderHeight()}
        renderStickyHeader={this.renderStickyHeader}

        onChangeHeaderVisibility={this.onChangeHeaderVisibility}

        stickyHeaderIndices={[1]}
        renderBodyComponentHeader={this.renderStickyRefineSection}

        parallaxHeaderHeight={this.foregroundHeight()}
        parallaxHeaderContainerStyles={{marginBottom:stickyTopMargin}}
        >

        <View style={{ marginTop:20, paddingLeft: this.commonPadding, paddingRight: this.commonPadding }}>
            { this.renderSectionForTab() }
        </View>

      </ParallaxScrollView>
    )
  }

  artworkQuerySummaryString = () => {
    let works = this.props.gene.filtered_artworks.total.toLocaleString()
    let medium = this.props.medium === '*' ? '' : ' ・ ' + _.startCase(this.props.medium)
    let price_range = this.props.price_range === '*-*' ? '' : ' ・ ' + this.priceRangeToHumanReadableString(this.props.price_range)
    return `${works} works${medium}${price_range}`
  }


 priceRangeToHumanReadableString = (range: string) => {
  const dollars = (value: string) => {
    return parseInt(value, 10).toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 0})
  }

  if (range === '*-*') { return '' }
  if (range.includes('-*')) {
    const below = dollars(range.split('-*')[0])
    return `Above ${below}`
  }
  if (range.includes('*-')) {
    const below = dollars(range.split('*-').pop())
    return `Below ${below}`
  }
  const [first, second] = range.split('-')
  return `${dollars(first)} - ${dollars(second)}`
}

  stateQuery = () => { }

  resolveQuery = (component: ArtworksGrid, page: number, state: any) : string => {
    return `
    {
      gene(id: "${this.props.gene.id}") {
        filtered_artworks(medium: "${this.props.medium}", price_range: "${this.props.price_range}", page:${page}, aggregations:[TOTAL], for_sale: true){
          total
          hits {
            id
            title
            date
            sale_message
            image {
              url(version: "large")
              aspect_ratio
            }
            artist {
              name
            }
            partner {
              name
            }
            href
          }
        }
      }
    }
    `
  }
}


const styles = StyleSheet.create({
  header: {
    width: isPad ? 330 : null,
    alignSelf: isPad ? 'center' : null,
  }
})


export default Relay.createContainer(Gene, {
  // fallbacks for when no medium/price_range is set
  initialVariables: {
    medium: '*',
    price_range: '*-*'
  },
  fragments: {
    gene: () => Relay.QL`
      fragment on Gene {
        _id
        id
        ${Header.getFragment('gene')}
        ${About.getFragment('gene')}
        filtered_artworks(medium: $medium, price_range: $price_range, aggregations:[MEDIUM, PRICE_RANGE, TOTAL], page:1, for_sale: true){
          total
          aggregations {
            slice
            counts {
              id
              name
            }
          }
        }
      }
    `,
  }
})