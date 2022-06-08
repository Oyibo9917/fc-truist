( function() {
  YO();

  function YO() {
    try {
      // let phoS = 100;   pho();
      let zoS = 100;    zo();

      // function pho() {
      //   let $pho = $( 'a[data-href="tel:(000) 000-0000"]' ).parent();
      //   console.log( 'pho!', phoS, $pho.length );
      //   $pho.length && $pho.css( 'display', 'none' ) || phoS-- && setTimeout( pho, 420 );
      // }

      function zo() {
        let $zo = $( 'p.address:contains(-0000)' );
        console.log( 'zo!', zoS, $zo.length );
        $zo.length && $zo.html( ( i, was ) => was.replace( /-0000/, '' ) ) || zoS-- && setTimeout( zo, 400 );
      }
    }
    catch ( err ) {
       console.warn( err );
       setTimeout( YO, 420 );
    }
  }
} )()