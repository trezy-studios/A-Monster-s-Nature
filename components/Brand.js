// Module imports
import React from 'react'
import SVG from 'react-svg-inline'

// Local imports
import AMNLogo from '../public/images/logo.white.svg'





const Brand = () => (
  <>
    {/* eslint-disable-next-line react/jsx-pascal-case */}
    <SVG
      accessibilityLabel="A Monster's Nature logo"
      className="brand"
      cleanup
      component="h1"
      svg={AMNLogo} />
    {/* <picture>
      <source
        srcSet="/images/logo.svg"
        type="image/svg+xml" />
      <source
        srcSet="pyramid.webp"
        type="image/webp">
      <img
        alt="A Monster's Nature logo"
        src="/images/logo.png"
        srcSet={[
          '/images/logo.png 1x',
          '/images/logo@2x.png 2x',
          '/images/logo@3x.png 3x',
          '/images/logo@4x.png 4x',
        ]} />
    </picture> */}
  </>
)





export default Brand
