$('input, select, textarea').on("invalid", function(e) {
  e.preventDefault();
});

const TDSFormGroup = {
  formGroupClass: '.js-tds-form-group',
  labelClass: '.js-tds-form-group__label',
  controlClass: '.js-tds-form-group__control',
  phoneClass: '.js-tds-phone',
  selectClass: '.js-tds-form-group__select',

  Cache: {},

  cacheDom() {
    this.Cache.$formGroup = $(this.formGroupClass);
    this.Cache.$control = $(this.controlClass);
    this.Cache.$label = $(this.labelClass);
    this.Cache.$phone = $(this.phoneClass);
    this.Cache.$select = $(this.selectClass);
  },

  preRender() {
    this.Cache.$control.each(function () {
      TDSFormGroup.getValue($(this));
    });
  },

  bindEvents() {
    this.Cache.$control.on('input', function () {
      TDSFormGroup.getValue($(this));
    });

    this.Cache.$control.on('focus', function () {
      TDSFormGroup.getValue($(this));
    });

    this.Cache.$control.on('blur', function () {
      TDSFormGroup.getValue($(this));
    });

    this.Cache.$phone.on('keyup', function () {
      TDSFormGroup.phoneFormat($(this));
    });

    if ($('.js-mail-radio').length > 0) {
      $( '.js-mail-radio' ).on('blur change', function () {
        if (!$(this).is(':checked')) {
            CharacterCheck.addErrorRadioState( $( this ) );
            CharacterCheck.showSiblingError($( this ), '.js-char-check__error--empty' );
        } else {
          CharacterCheck.removeErrorRadioState( $( this ) );
          CharacterCheck.hideSiblingError($( this ), '.js-char-check__error--empty' );
        }
      });
    }
          if ($('.js-plat-radio').length > 0) {
       $( '.js-plat-radio' ).on('blur change', function () {
        if (!$(this).is(':checked')) {
            CharacterCheck.addErrorRadioState( $( this ) );
            CharacterCheck.showSiblingError($( this ), '.js-char-check__error--empty' );
        } else {
          CharacterCheck.removeErrorRadioState( $( this ) );
          CharacterCheck.hideSiblingError($( this ), '.js-char-check__error--empty' );
        }
      });
}
  },

  setId(target) {
    let $target = $(target);

    $target.each(function (i) {
      let $getInput = $(this).children(TDSFormGroup.controlClass);
      let $getLabel = $(this).children(TDSFormGroup.labelClass);

      $getInput.attr('id', 'form-field-' + i);
      $getLabel.attr('for', 'form-field-' + i);
    });
  },

  rotateIcon(target) {
    let $icon = $(target).siblings('.tds-form-group__arrow-icon')

    if (!$icon.hasClass('is-rotated')) {
      $icon.addClass('is-rotated');
    } else {
      $icon.removeClass('is-rotated');
    }
  },
    getValue(target) {
      $(target).focus(function() {
        $(target).siblings(TDSFormGroup.labelClass).addClass('tds-form-group__label--focused');
        $(target).parents(TDSFormGroup.formGroupClass).addClass('tds-form-group--focused');
      })
        $(target).blur(function() {
          if ( $(target).val().length === 0){
            $(target).siblings(TDSFormGroup.labelClass).removeClass('tds-form-group__label--focused');
            $(target).parents(TDSFormGroup.formGroupClass).removeClass('tds-form-group--focused');
            $('select').siblings(TDSFormGroup.labelClass).addClass('tds-form-group__label--focused');
          } else if ($(target).val().length > 0)
          $(target).parents(TDSFormGroup.formGroupClass).removeClass('tds-form-group--focused');
          $('select').siblings(TDSFormGroup.labelClass).addClass('tds-form-group__label--focused');
        });
      // }
      // if ($(target).is('select')) {
      // }
    },

    phoneFormat(target) {
      let inputnum = $(target).val().replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);

      $(target).val(!inputnum[2] ? inputnum[1] : '(' + inputnum[1] + ') ' + inputnum[2] + (inputnum[3] ? '-' + inputnum[3] : ''))
    },

    init: () => {
      TDSFormGroup.cacheDom();
      TDSFormGroup.preRender();
      TDSFormGroup.bindEvents();
    }



};

CharacterCheck = {
  inlineErrorClass: '.js-char-check__error',
  tooLongErrorClass: '.js-char-check__error--length',
  charErrorClass: '.js-invalid-char',
  repeatErrorClass: '.js-repeating-char',
  charErrorClassNum: '.js-char-check__error--invalid-num',
  minValErrorClass: '.js-char-check__error--min-val',
  requiredErrorClass: '.js-char-check__error--empty',
  maxValErrorClass: '.js-char-check__error--max-val',
  charResultsErrorClass: '.js-char-check__error--char-results',
  initialErrorClass: '.js-char-check__error--initial',
  tooShortErrorClass: '.js-char-check__error--tooShort',
  notMatchInterval: '.js-char-check__error--notInterval',

  init: function() {
    this.cacheDom();
    this.setInitialState();
    this.bindEvents();
  },

  Cache: {},

  cacheDom: function() {
    this.Cache.$input = $( '.js-char-check' );
    this.Cache.errorArray = [];
    this.Cache.$submitButton = $( '.js-submit-button' );
  },

  bindEvents: function() {
    this.Cache.$input.on( 'input', function() {
      CharacterCheck.attachState($(this), CharacterCheck.setState($(this)));
      CharacterCheck.liveValidate( $(this) );
    } );

    this.Cache.$input.each(function() {
    $( this ).on( 'blur change', function() {
      var $this = $( this ),
          siblingId = $this.parent().siblings( '.js-char-check__error--empty ').attr( 'id' );

          if (!$this.attr( 'aria-describedby' ) ) {
            $this.removeAttr( 'aria-describedby' )
          }
          if ($this.prop('required') && $this.val().length  == 0  ) {
          // var ariaArray = $this.data( 'State' ).Aria.describedby,
            ariaDescribedbyAttr = $this.attr( 'aria-describedby' ),
            idArray = [],
            filteredAttrArray = [ariaDescribedbyAttr],
            filteredAttrArray;


        if ( ariaDescribedbyAttr !== undefined ) {
          filteredAttrArray = ariaDescribedbyAttr
          .split( ' ' )
          .filter( function( item ) {
            return item[0].toLowerCase() !== 'e';
          } );
        }

        $( '.js-char-check__error' ).each( function() {
          if ( !$( this ).hasClass( 'js-display-block' ) && filteredAttrArray.includes($( this ).attr( 'id' ))  ) {
            filteredAttrArray.splice(0, 1)
          }
        });
        filteredAttrArray.unshift( siblingId );
        reducedArr = filteredAttrArray.reduce( function ( a, b ) {
                      if ( a.indexOf( b ) == -1 ) {
                        a.push( b )
                      }
                      return a;
                    }, []);


        var arrMap = reducedArr.join( ' ' ).trim(' ');

        $this.attr( 'data-has-violations', 'true' );
        $this.attr( 'aria-invalid', 'true' );
        CharacterCheck.addErrorState( $this );
        $this.attr( 'aria-describedby',  arrMap );
        CharacterCheck.showSiblingError( $this, '.js-char-check__error--empty' );
        return;
      } else {
        $this.attr( 'data-has-violations', 'false' );
        $this.attr( 'aria-invalid', 'false' );
        $this.attr( 'aria-describedby',  arrMap );
        CharacterCheck.removeErrorState( $this );
        CharacterCheck.hideSiblingError( $this, '.js-char-check__error--empty' );
      }

      CharacterCheck.setViolationState( $this );
      CharacterCheck.postValidate( $this );
      CharacterCheck.exitValidate( $this );
      CharacterCheck.updateAriaState( $this );
      CharacterCheck.setAriaDescribedby( $this );
      CharacterCheck.clearErrorArray();
    } );
  });

    this.Cache.$submitButton.on( 'click', function( e ) {



      CharacterCheck.Cache.$input.each( function() {
        var $this = $( this ),
            siblingId = $this.parent().siblings( '.js-char-check__error--empty ').attr( 'id' );

        if (!$this.attr( 'aria-describedby' ) ) {
          $this.removeAttr( 'aria-describedby' )
        }

        if ( $this.prop( 'required' ) && !$this.val().length && $this.is(':visible') ) {
          // var ariaArray = $this.data( 'State' ).Aria.describedby,
              ariaDescribedbyAttr = $this.attr( 'aria-describedby' ),
              idArray = [],
              filteredAttrArray = [ariaDescribedbyAttr],
              filteredAttrArray;


          if ( ariaDescribedbyAttr !== undefined ) {
            filteredAttrArray = ariaDescribedbyAttr
            .split( ' ' )
            .filter( function( item ) {
              return item[0].toLowerCase() !== 'e';
            } );
          }

          $( '.js-char-check__error' ).each( function() {
            if ( !$( this ).hasClass( 'js-display-block' ) && filteredAttrArray.includes($( this ).attr( 'id' ))  ) {
              filteredAttrArray.splice(0, 1)
            }
          });
          filteredAttrArray.unshift( siblingId );
          reducedArr = filteredAttrArray.reduce( function ( a, b ) {
                        if ( a.indexOf( b ) == -1 ) {
                          a.push( b )
                        }
                        return a;
                      }, []);


          var arrMap = reducedArr.join( ' ' ).trim(' ');
          $this.attr( 'data-has-violations', 'true' );
          $this.attr( 'aria-invalid', 'true' );
          CharacterCheck.addErrorState( $this );
          $this.attr( 'aria-describedby', arrMap );
          CharacterCheck.showSiblingError( $this, '.js-char-check__error--empty' );
        }
      });

                if (!$('.js-plat-radio').is(':checked')) {
            CharacterCheck.addErrorRadioState($('.js-plat-radio'));
            CharacterCheck.showSiblingError($('.js-plat-radio'), '.js-char-check__error--empty');
          }
          if (!$('.js-mail-radio').is(':checked')) {
            CharacterCheck.addErrorRadioState($('.js-mail-radio'));
            CharacterCheck.showSiblingError($('.js-mail-radio'), '.js-char-check__error--empty');
          }


    } );
  },

    // Validation that occurs live, controlling how the input's state is rendered
  liveValidate: function( $input ) {
    var State = this.getState( $input ),
        hasViolations;
    this.setViolationState( $input );

    hasViolations = this.getViolationState( $input );

    if ( State.Violations.initial === true ) {
      this.showSiblingError( $input, this.initialErrorClass );
    }

    if ( State.Violations.initial === false ) {
      this.hideSiblingError( $input, this.initialErrorClass );
    }

    if ( State.Violations.invalidChar === true ) {
      this.showSiblingError( $input, this.charErrorClass );
    }

    if ( State.Violations.repeating === true ) {
      this.showSiblingError( $input, this.repeatErrorClass );
    }

    if ( State.Violations.invalidChar === false ) {
      this.hideSiblingError( $input, this.charErrorClass );
    }

    if ( State.Violations.repeating == false ) {
      this.hideSiblingError( $input, this.repeatErrorClass );
    }

    if ( State.Violations.invalidCharNum == false ) {
      this.hideSiblingError( $input, this.charErrorClassNum );
    }

    if ( State.Violations.tooLong === true ) {
      this.showSiblingError( $input, this.tooLongErrorClass );
    }

    if ( State.Violations.tooLong === false ) {
      this.hideSiblingError( $input, this.tooLongErrorClass );
    }

    if ( State.Violations.tooShort == false ) {
      this.hideSiblingError( $input, this.tooShortErrorClass );
    }

    if ( State.Violations.tooLow == false ) {
      this.hideSiblingError( $input, this.minValErrorClass );
    }

    if ( State.Violations.tooHigh == true ) {
      this.showSiblingError( $input, this.maxValErrorClass );
    }

    if ( State.Violations.tooHigh == false ) {
      this.hideSiblingError( $input, this.maxValErrorClass );
    }
    if ( State.Violations.charResults === true ) {
      this.showSiblingError( $input, this.charResultsErrorClass );
    }

    if ( State.Violations.charResults === false ) {
      this.hideSiblingError( $input, this.charResultsErrorClass );
    }

    if ( State.Violations.requiredField == false ) {
      this.hideSiblingError( $input, this.requiredErrorClass );
    }

    if ( State.Violations.notInterval == false ) {
      this.hideSiblingError( $input, this.notMatchInterval );
    }


    if ( State.entryLength === 0 || hasViolations === false ) {
      if ( State.Violations.empty === true ) {
        return;
      }
      this.removeErrorState( $input );
    }
  },


  submitValidate: function( $input ) {
    var State = this.getState( $input ),
        hasViolations = this.getViolationState( $input );

    if ( State.Violations.requiredField == true ) {
      this.showSiblingError( $input, this.requiredErrorClass );
    }

    if ( hasViolations === true ) {
      this.addErrorState( $input );
    }

    if ( hasViolations === false ){
      this.removeErrorState( $input );
    }
  },

  exitValidate: function( $input ) {
    var State = this.getState( $input ),
        hasViolations = this.getViolationState( $input );

    if ( State.Violations.tooShort == true ) {
      this.showSiblingError( $input, this.tooShortErrorClass );
    }
    if ( hasViolations === true ) {
      this.addErrorState( $input );
    }
    if ( hasViolations === false ) {
      this.removeErrorState( $input );
    }
  },

  // Used beyond live validation to indicate a change must be made before the user can proceed
  postValidate: function( $input ) {
    var State = this.getState( $input ),
        hasViolations = this.getViolationState( $input );

    // The `tooLow` check only occurs after the user exits the field to ensure
    // the message does not show inappropriately, i.e., the user types `1` then `5` showing an error
    // that the amount is below `5` when the user first hits the `1` key
    if ( State.Violations.tooLow == true ) {
      this.showSiblingError( $input, this.minValErrorClass );
    }

    if ( State.Violations.invalidCharNum == true ) {
      this.showSiblingError( $input, this.charErrorClassNum );
    }
    if ( State.Violations.notInterval == true ) {
      this.showSiblingError( $input, this.notMatchInterval );
    }
    if ( hasViolations === true ) {
      this.addErrorState( $input );
    }
    if ( hasViolations === false ) {
      this.removeErrorState( $input );
    }
  },


  // Defines a State object based on user input
  setState: function( $input ) {
    var State = {
          Violations: {}, // initially, the user has committed no violations
          Aria: {}
        },

        entry = this.getUserEntry( $input ),
        entryLength = entry.length,
        inputResults = this.getCharResults( $input ),
        charLimit = this.getCharacterLimit( $input ),
        minLimit = this.getMinCharacterLimit( $input ),
        valueMin = this.getMinValue( $input ),
        valueMax = this.getMaxValue( $input ),
        requiredField = this.getRequiredField( $input ),
        allowedChars = this.getAllowedCharacters( $input ),
        allowedNum = this.getAllowedNum( $input ),
        tooLong = this.testEntryLength( entryLength, charLimit ),
        tooShort = this.testEmptylength( $input, entryLength, minLimit ),
        repeating = this.testRepeat( $input ),
        invalidChar = this.testCharacters( entry, allowedChars ),
        invalidCharNum = this.testNum( entry, allowedNum ),
        tooLow = this.testMinValue( entry, valueMin ),
        tooHigh = this.testMaxValue( entry, valueMax ),
        charResults = this.testCharResults( inputResults ),
        notInterval = this.testInterval( $input );
    // State is updated depending on whether the above functions result in violations
    State.entry = entry;
    State.entryLength = entryLength;
    State.Violations.tooLong = tooLong;
    State.Violations.tooShort = tooShort;
    State.Violations.repeating = repeating;
    State.Violations.invalidChar = invalidChar;
    State.Violations.invalidCharNum = invalidCharNum;
    // State.Violations.requiredField = requiredField;
    State.Violations.notInterval  = notInterval;
    State.Violations.tooLow = tooLow;
    State.Violations.tooHigh = tooHigh;
    State.Violations.charResults = charResults;
    State.Violations.initial = false;
    State.Aria.describedby = null;

    return State;
  },

  // Attaches state object to element, allowing multiple state instances on a page
  attachState: function( $input, StateObj ) {
    $input.data( 'State', StateObj );
  },

  // Grabs the state from a particular input for later use
  getState: function( $input ) {
    return $input.data( 'State' );
  },

  // Check to determine whether input field is empty in an error flow
  checkInitialState: function( $input ) {
    if ( $input.data( 'initialStateViolation' ) === true ) $input.data( 'State' ).Violations.initial = true;
  },

  // Checks if component state has any rule violations, returning true or false
  setViolationState: function( $input ) {
    var StateObj = this.getState( $input );
    var $siblingError = $input.parents().siblings( '.js-server-check__error' )
    for ( var index in StateObj.Violations ) {
      if ( StateObj.Violations[index] === true || $siblingError.hasClass( 'js-display-block' ) ) {
        $input.attr( 'data-has-violations', 'true' );
        break;
      } else {
        $input.attr( 'data-has-violations', 'false' );
      }
    }
  },

  // On page load checks if the input is in error state
  setInitialState: function() {
    this.Cache.$input.each( function() {
      var $this = $( this );
      $this.data( 'State',  CharacterCheck.setState( $this ) );
       CharacterCheck.setViolationState( $this );
       CharacterCheck.checkInitialState( $this );
      CharacterCheck.postValidate($this);
      CharacterCheck.liveValidate( $this );
       CharacterCheck.updateAriaState( $this );
       CharacterCheck.setAriaDescribedby( $this );
       CharacterCheck.clearErrorArray();
    })
  },

  // Check whether an `<input>` is currently in violation of any of its restrictions
  getViolationState: function( $input ) {
    var hasViolationStr = $input.attr( 'data-has-violations' ),
        hasViolationBool = JSON.parse( hasViolationStr ); // NOTE: See: https://stackoverflow.com/questions/263965/how-can-i-convert-a-string-to-boolean-in-javascript

    return hasViolationBool;
  },

  // Show a sibling error next to an `<input>` targeted with a class
  showSiblingError: function( $input, siblingErrorClass ) {
    $input
      .parents()
      .siblings( siblingErrorClass )
      .removeClass('display-none')
      .addClass('js-display-block')


    this.addErrorArrayClass( siblingErrorClass );
  },

  // Hide a sibling error next to an `<input>` targeted with a class
  hideSiblingError: function( $input, siblingErrorClass ) {
    $input
      .parents()
      .siblings( siblingErrorClass )
      .removeClass('js-display-block')
      .addClass('display-none')


    this.removeErrorArrayClass( siblingErrorClass );
  },


  // Add error state to an `<input>`
  addErrorState: function( $input ) {
    $input
      .attr( 'invalid', '' )
      .attr( 'aria-invalid', 'true' )
      .closest( '.js-tds-form-group' )
      .addClass( 'tds-form-group--error' );
  },

  // Remove error state from an `<input>`
  removeErrorState: function( $input ) {
    $input
      .removeAttr( 'invalid' )
      .attr( 'aria-invalid', 'false' )
      .closest( '.js-tds-form-group' )
      .removeClass( 'tds-form-group--error' );
  },

  addErrorRadioState: function( $input ) {
    $input
      .attr( 'invalid', '' )
      .attr('aria-invalid', 'true')
      .parents()
      .parents('.js-tds-toggle-grup')
      .addClass('tds-toggle-group--error');
    // console.log($input.parents().parents())
    $input
      .parents()
      .siblings( '.js-tds-toggle-group__legend' )
      .addClass( 'tds-toggle-group__legend--error' );
  },

  // Remove error state from an `<input>`
  removeErrorRadioState: function( $input ) {
    $input
      .removeAttr( 'invalid' )
      .attr('aria-invalid', 'false')
      .parents()
      .parents('.js-tds-toggle-grup')
      .removeClass('tds-toggle-group--error');

    $input
      .parents()
      .siblings( '.js-tds-toggle-group__legend' )
      .removeClass( 'tds-toggle-group__legend--error' );
  },


  // Retrieve regex pattern from `<input>` for use with character restriction check
  getAllowedCharacters: function( $input ) {
    var regexStr = $input.attr( 'data-allowed-chars' ),
        regexFlags = $input.attr( 'data-regex-flags' ),
        regex = new RegExp( regexStr, regexFlags );

    return regex;
  },

  getAllowedNum: function( $input ) {
    var regexStr = $input.attr( 'data-allowed-nums' ),
        regexFlags = $input.attr( 'data-regex-flags' ),
        regex = new RegExp( regexStr, regexFlags );

    return regex;
  },

  // Retrieve character limit rule from a particular `<input>`
  getCharacterLimit: function( $input ) {
    return $input.attr( 'data-char-limit' );
  },
  // Retrieve Minimum character limit rule from a particular `<input>`
  getMinCharacterLimit: function( $input ) {
    return $input.attr( 'data-char-min-limit' );
  },

  getRepeatingCharacter: function( $input ) {
    var regexStr = $input.attr( 'data-char-repeat' ),
        regexFlags = $input.attr( 'data-regex-flags' ),
        regex = new RegExp( regexStr, regexFlags );

    return regex;
  },

  // Retrieve the integer value floor from a particular `<input>`
  getMinValue: function( $input ) {
    return $input.attr( 'data-min-val' );
  },

  // Retrieve the integer value ceiling from a particular `<input>`
  getMaxValue: function( $input ) {
    return $input.attr( 'data-max-val' );
  },

  // Retrieve user entry from an input
  getUserEntry: function( $input ) {
    return $input.val();
  },

  getRequiredField: function( $input ) {
    if ( $input.prop( 'required' ) && $input.val().length === 0) {
      return true;
    } else {
      return false;
    }
  },

  getCharResults: function( $input ) {
    return $input.attr( 'data-char-results' );
  },


  // Check if input value is an interger of data-interval-num
  testInterval: function( $input ) {
    var intervalNum = $input.attr( 'data-interval-num' ),
        inputNum = parseFloat( $input.val().replace(/,/g, '') );

    if ( $input.val().length && $input.attr( 'data-interval-num' )) {
      if ( inputNum % intervalNum != 0 ) {
        return true;
      } else {
        return false;
      }
    }
  },

  // Check is string violated allowed characters regex pattern
  testCharacters: function( string, allowedCharactersRegEx ) {
    if ( string.length && !allowedCharactersRegEx.test( string ) ) {
      return true;
    } else {
      return false;
    }
  },

  testRepeat: function( $input ) {
    var intervalRepeat = $input.attr( 'data-interval-rep' );
    if ( $input.val().length && intervalRepeat == 'yes' ) {
      var regex = /(.)\1{2}/;
        if ( regex.test( $input.val() ) ) {
          return true;
        }
      return false;
    }
  },

  testNum: function( string, allowedCharactersRegEx ) {
    if ( string.length && !allowedCharactersRegEx.test( string ) ) {
      return true;
    } else {
      return false;
    }
  },

  testEntryLength: function( length, limit ) {
    if ( length > limit ) {
      return true;
    } else {
      return false;
    }
  },

  testEmptylength: function ($input, length, limit) {
    if ($input.val().length) {
      if ( length <= limit ) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  },

  // Test whether value is below minimum
  testMinValue: function( value, minVal ) {
    var stripedMin = value.replace(/,/g, '');
    if ( value.length && Number( stripedMin ) < Number( minVal ) ) {
      return true;
    } else {
      return false;
    }
  },

  // Test whether value is above minimum
  testMaxValue: function( value, maxVal ) {
    var stripedMax = value.replace(/,/g, '');
    if ( value.length && Number( stripedMax ) > Number( maxVal ) ) {
      return true;
    } else {
      return false;
    }
  },

  testCharResults: function( noResults ) {
    if ( noResults === 'true' ) {
      return true;
    } else {
      return false;
    }
  },

  clearErrorArray: function() {
    this.Cache.errorArray = [];
  },

  updateAriaState: function( $input ) {
    if ( this.Cache.errorArray.length !== 0 ) {
      $input.data( 'State' ).Aria.describedby = this.Cache.errorArray;
    }
  },

  filterArrayDuplicates: function( array ) {
    return array.filter( function( arrayItem, arrayIndex ) {
      return array.indexOf( arrayItem ) === arrayIndex;
    } );
  },

  addErrorArrayClass: function( siblingErrorClass ) {
    if ( $.inArray( siblingErrorClass, this.Cache.errorArray ) === -1 ) this.Cache.errorArray.push( siblingErrorClass );
  },

  removeErrorArrayClass: function( siblingErrorClass ) {
    for ( var i = 0; i < this.Cache.errorArray.length; i++ ) {
      if ( this.Cache.errorArray[i] == siblingErrorClass ) this.Cache.errorArray.splice( i, 1 );
    }
  },

  setAriaDescribedby: function ($input) {

    var ariaDescribedbyAttr = $input.attr( 'aria-describedby' ),
        idArray = [],
        filteredAttrArray = [ariaDescribedbyAttr],
        filteredIdArray,
        arrMap;
    // console.log(ariaDescribedbyAttr)
    if (ariaDescribedbyAttr !== undefined && $input.is(':visible')) {
        filteredAttrArray = ariaDescribedbyAttr
        .split( ' ' )
        .filter( function( item ) {
          return item[0].toLowerCase() !== 'e';
        } );
    } else {
        $input.removeAttr( 'aria-describedby' )
      }

    $($input).parent().siblings('.js-char-check__error, .js-server-check__error').each( function() {
      if ( $( this ).hasClass( 'js-display-block' ) ) {
        filteredAttrArray.unshift( $( this ).attr( 'id' ) ); // adds the inline error messages ID to the beginning of the array
      }

      if ( !$( this ).hasClass( 'js-display-block' ) && filteredAttrArray.includes($( this ).attr( 'id' ))  ) {
        filteredAttrArray.splice(0, 1)
      }
    });

    reducedArr = filteredAttrArray.reduce( function ( a, b ) {
                  if ( a.indexOf( b ) == -1 ) {
                    a.push( b )
                  }
                  return a;
                }, []);
    arrMap = reducedArr.join(' ').trim(' ');
    if (arrMap.length) {
      $input.attr( 'aria-describedby',  arrMap );
    } else {
       $input.removeAttr( 'aria-describedby' )
    }

  }
}

CharacterCheck.init();

TDSFormGroup.init();