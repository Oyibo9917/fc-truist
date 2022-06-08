(function() {
  const northern = ['AK', 'AZ', 'CO', 'CT', 'DE', 'HI', 'ID', 'IL', 'IA', 'KS', 'LA', 'ME', 'MA', 'MI', 'MN', 'MO', 'MT', 'NE', 'NV', 'NH', 'NM', 'NY', 'ND', 'OK', 'OR', 'RI', 'SD', 'UT', 'VT', 'WA', 'WI', 'WY'];

  const southern = ['AL', 'AR', 'DC', 'FL', 'GA', 'IN', 'KY', 'MD', 'MS', 'NC', 'NJ', 'OH', 'PA', 'SC', 'TN', 'TX', 'VA', 'WV'],
   // Gloabl Vars (States, except California, because... well... It's California)

   // Form Label Animation on selectbox
   animateLabel = () => {
    $("select").on("focus", function () {
     let $field = $(this).closest("div.field");
     if (this) {
      $field.addClass("filled");
     } else {
      $field.removeClass("filled");
     }
    });
    $("select").on("blur", function () {
     let $field = $(this).closest("div.field");
     if (this.value) {
      $field.addClass("filled");
     } else {
      $field.removeClass("filled");
     }
    });
   };
  animateLabel();
  // Form Label Animation on selectbox

  // Custom Radios
  /* Label focus state for a11y */
  $('.lending-tree-body .custom-radio').on('focus', function () {
   let label = $(this).closest('label');
   $(label).addClass('focus');
  });

  $('.lending-tree-body .custom-radio').on('blur', function () {
   let label = $(this).closest('label');
   $(label).removeClass('focus');
  });

  // Loan Types
  $('.loan-types .custom-radio').on('click', function () {
   let label = $(this).closest('label');
   $('.loan-types label.radio').removeClass('checked');
   $('.loan-types .custom-radio').prop('checked', false);
   $(label).removeClass('focus');
   $(label).toggleClass('checked');
   if ($(label).hasClass('checked')) {
    $(label).find('.custom-radio').prop('checked', true);
    $(label).closest('fieldset').find('.fill').prop('disabled', false);
   } else {
    $(label).find('.custom-radio').prop('checked', false);
   }
  });

  // Funds Access
  $('.funds-access .custom-radio').on('click', function () {
   let label = $(this).closest('label');
   $('.funds-access label.radio').removeClass('checked');
   $('.funds-access .custom-radio').prop('checked', false);
   $(label).removeClass('focus');
   $(label).toggleClass('checked');
   if ($(label).hasClass('checked')) {
    $(label).find('.custom-radio').prop('checked', true);
   } else {
    $(label).find('.custom-radio').prop('checked', false);
   }
   $(label).closest('fieldset').find('.fill').prop('disabled', false);
  });

  // Borrow Amount
  $('.borrow-amount .custom-radio').on('click', function () {
   let label = $(this).closest('label');
   $('.borrow-amount label.radio').removeClass('checked');
   $('.borrow-amount .custom-radio').prop('checked', false);
   $(label).removeClass('focus');
   $(label).toggleClass('checked');
   if ($(label).hasClass('checked')) {
    $(label).find('.custom-radio').prop('checked', true);
   } else {
    $(label).find('.custom-radio').prop('checked', false);
   }
   $(label).closest('fieldset').find('.fill').prop('disabled', false);
  });

  // Borrow Amount
  $('.home-collateral .custom-radio').on('click', function () {
   let label = $(this).closest('label');
   $('.home-collateral label.radio').removeClass('checked');
   $('.home-collateral .custom-radio').prop('checked', false);
   $(label).removeClass('focus');
   $(label).toggleClass('checked');
   if ($(label).hasClass('checked')) {
    $(label).find('.custom-radio').prop('checked', true);
   } else {
    $(label).find('.custom-radio').prop('checked', false);
   }
   $(label).closest('fieldset').find('.fill').prop('disabled', false);
  });

  // Hide disclures paragraphs. Will select the disclosures to diaplay depending on results
  $('.disclosure').hide();

  // Form progression
  //fieldsets
  let current_panel, next_panel, previous_panel;
  let current = 1;
  let form = $('#lending-tree');

  $('.lending-tree-body .next').on('click', function () {
   current_panel = $(this).closest('fieldset');
   next_panel = $(this).closest('fieldset').next();
   // hide the current fieldset
   current_panel.removeClass('active');
   // show the next fieldset
   next_panel.addClass('active');
  });

  $('.lending-tree-body .previous').on('click', function () {
   current_panel = $(this).closest('fieldset');
   previous_panel = $(this).closest('fieldset').prev();
   // hide the reseults fieldset if showing
   if ($('.results').hasClass('active')) {
    $('.results').removeClass('active');
   }
   // show the previous fieldset
   previous_panel.addClass('active');
   // hide the current fieldset
   current_panel.removeClass('active');
  });

  $('.lending-tree-body .reset').on('click', function () {
   $('.results').removeClass('active');
   $('.start').addClass('active');
   $('.lending-tree-body .custom-radio').prop('checked', false);
   $('label.radio').removeClass('checked');
   $('.field.filled').removeClass('filled');
   $('.lending-tree-body .next:not(:first-of-type').prop('disabled', true);
   $('.loan, .disclosure-container').css({
    'display': 'none'
   });
   $('.disclosure').hide();
  });
  // Form progression

  // State selection
  $('.lending-tree-body #state').on('change', function () {
   if (this.value != null &&
    this.value != 'undefined' &&
    this.value != '') {
    $(this).closest('fieldset').find('.fill').removeAttr('disabled', 'disabled');
   }
  });

  // The form branches at this point, depending on the state selection
  $('.state-selection .next').on('click', function () {

   //***************** Home improvement *************************
   // Branch flow
   // Home Improvement -> Northern States = Lightstream (Lightstream Home Improvement Loan)
   let i;
   for (i = 0; i < northern.length; i++) {
    if ($('#home-improvement').is(':checked') && $('#state').val() == northern[i]) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show the results fieldset and populate with Lightstream content
     $('.results').addClass('active');
     $('.results .lightstream-hi').css({
      'display': 'block'
     });
     // $('.results .lightstream .card-title h3').text('Lightstream Home Improvement Loan');
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.eight-disclosure').show();
    }
    // Branch flow
    // Home improvement -> California = HELOC
    else if ($('#home-improvement').is(':checked') && $('#state').val() == 'CA') {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show the results fieldset and populate with Heloc content
     $('.results').addClass('active');
     $('.results .heloc').css({
      'display': 'block'
     });
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.four-disclosure, .five-disclosure').show();
    }
    // Branch flow
    // Home improvement -> "Southern States" -> Access to Funds...
    else if ($('#home-improvement').is(':checked') && $('#state').val() == southern[i]) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show the funds access
     $('.funds-access').addClass('active');
    }

    // ***************** Consolidate *************************
    // Branch flow:
    // Consolidate -> Northern States = Lightstream (Credit Card Consolidation Loan)
    if ($('#consolidate-debt').is(':checked') && $('#state').val() == northern[i]) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show the results fieldset and populate with Lightstream content
     $('.results').addClass('active');
     $('.results .lightstream-ccdc').css({
      'display': 'block'
     });
     // $('.results .lightstream .card-title h3').text('Lightstream Credit Card Debt Consolidation Loan');
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.eight-disclosure').show();
    }
    // Branch flow
    // Consolidate -> California -> Home collateral...
    else if ($('#consolidate-debt').is(':checked') && $('#state').val() == 'CA') {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show the Home collateral fieldset
     $('.home-collateral').addClass('active');
     // Update the question sequence number
     $('.home-collateral h2').text('Question 3');
    }
    // Branch flow
    // Consolidate -> Southern States -> funds access...
    else if ($('#consolidate-debt').is(':checked') && $('#state').val() == southern[i]) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show the Funds access fieldset
     $('.funds-access').addClass('active');
    }

    // ***************** Finance Purchase *************************
    // Branch flow
    // Finance -> Northern States = Lightstream (Lightstream Unsecured Loan)
    if ($('#finance-purchase').is(':checked') && $('#state').val() == northern[i]) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show the results fieldset and populate with Lightstream content
     $('.results').addClass('active');
     $('.results .lightstream-upl').css({
      'display': 'block'
     });
     // $('.results .lightstream .card-title h3').text('Lightstream Unsecured Personal Loan');
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.eight-disclosure').show();
    }
    // Branch flow
    // Finance -> California -> Home collateral...
    else if ($('#finance-purchase').is(':checked') && $('#state').val() == 'CA') {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show the Home collateral fieldset
     $('.home-collateral').addClass('active');
     // Update the question sequence number
     $('.home-collateral h2').text('Question 3');
    }
    // Branch flow
    // Finance -> Southern States -> Funds Access...
    else if ($('#finace-purchase').is(':checked') && $('#state').val() == southern[i]) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     //show funds access fieldset
     $('.funds-access').addClass('active');
    }

    // ***************** Buy Car *************************
    // Branch flow
    // Buy Car -> Northern States = Lightstream (Lightstream Auto Loan)
    if ($('#buy-car').is(':checked') && $('#state').val() == northern[i]) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show the results fieldset and populate with Lightstream content
     $('.results').addClass('active');
     $('.results .lightstream-al').css({
      'display': 'block'
     });
     // $('.results .lightstream .card-title h3').text('Lightstream Auto Loan');
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.eight-disclosure, .nine-disclosure').show();
    }
    // Branch flow
    // Buy Car -> Southern States = Personal Loan (Truist Auto Loan), Personal Line of Credit
    else if ($('#buy-car').is(':checked') && $('#state').val() == southern[i]) {
     $('fieldset').removeClass('active');
     $('.results').addClass('active');
     $('.results .truist-auto-loan').css({
      'display': 'block'
     });
     // $('.results .personal-loan .card-title h3').text('Truist Auto Loan');
     $('.results .line-of-credit').css({
      'display': 'block'
     });
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.two-disclosure, .three-disclosure, .seven-disclosure').show();
    }
    // Branch flow
    // Buy Car -> California = Personal Loan, Personal Line of Credit
    else if ($('#buy-car').is(':checked') && $('#state').val() == 'CA') {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // results with
     $('.results').addClass('active');
     $('.results .truist-auto-loan').css({
      'display': 'block'
     });
     // $('.results .personal-loan .card-title h3').text('Truist Auto Loan');
     $('.results .line-of-credit').css({
      'display': 'block'
     });
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.two-disclosure, .three-disclosure, .seven-disclosure').show();
    }

    // ***************** Unexpected Expense (Emergency) *************************
    // Branch flow
    // Unexpected Expense -> Nothern States = Lightstream (Unsecured Loan)
    if ($('#emergency').is(':checked') && $('#state').val() == northern[i]) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show results with Lightstream (Lightstream Unsecured Loan)
     $('.results').addClass('active');
     $('.results .lightstream-upl').css({
      'display': 'block'
     })
     // $('.results .lightstream .card-title h3').text('Lightstream Unsecured Loan');
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.eight-disclosure').show();
    }
    // Branch flow
    // Unexpected Expense -> California -> Home Collateral...
    else if ($('#emergency').is(':checked') && $('#state').val() == 'CA') {
     //hide all fieldsets
     $('fieldset').removeClass('active');
     // show Home collateral fieldset
     $('.home-collateral').addClass('active');
    }
    // Branch flow
    // Unexpected Expense -> Southern States -> Borrow amount...
    else if ($('#emergency').is(':checked') && $('#state').val() == southern[i]) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show Borrow amount fieldset
     $('.borrow-amount').addClass('active');
    }
   }
  });

  // Funds Access
  $('.funds-access .next').on('click', function () {
   // hide all fieldsets
   $('fieldset').removeClass('active');
   // show borrow amount fieldset
   $('.borrow-amount').addClass('active');
  });

  // Display suggestions based on amount selected
  $('.borrow-amount .next').on('click', function () {

   //***************** Home improvement *************************
   // Branch flow
   /* Home improvement -> "Southern States" -> Access to Funds -> Borrow Amount ->
   1st option or 2nd option = Personal Loan, Line of Credit */
   if ($('#first-amount').is(':checked') && $('#home-improvement').is(':checked') ||
    $('#second-amount').is(':checked') && $('#home-improvement').is(':checked')) {
    // hide all fieldsets
    $('fieldset').removeClass('active');
    // show results with Personal Loan, Line of Credit
    $('.results').addClass('active');
    $('.results .personal-loan').css({
     'display': 'block'
    });
    $('.results .line-of-credit').css({
     'display': 'block'
    });
    $('.disclosure-container').css({
     'display': 'block'
    });
    $('.one-disclosure, .two-disclosure, .three-disclosure').show();
   }
   // Branch flow
   /* Home improvement -> "Southern States" -> Access to Funds -> Borrow Amount ->
   3rd option or 4th option or 5th option = HELOC, Personal Loan, Line of Credit */
   else if ($('#third-amount').is(':checked') && $('#home-improvement').is(':checked') ||
    $('#fourth-amount').is(':checked') && $('#home-improvement').is(':checked') ||
    $('#fifth-amount').is(':checked') && $('#home-improvement').is(':checked')) {
    // hide all fieldsets
    $('fieldset').removeClass('active');
    // show results fieldset with Personal Loan, Line of Credit, HELOC
    $('.results').addClass('active');
    $('.results .personal-loan').css({
     'display': 'block'
    });
    $('.results .line-of-credit').css({
     'display': 'block'
    });
    $('.results .heloc').css({
     'display': 'block'
    });
    $('.disclosure-container').css({
     'display': 'block'
    });
    $('.one-disclosure, .two-disclosure, .three-disclosure, .four-disclosure, .five-disclosure').show();
   }

   //***************** Consolidate *************************
   // Branch flow
   /* Consolidate -> "Southern States" -> Access to Funds -> Borrow Amount ->
   1st option or 2nd option = Personal Loan, Line of Credit */
   else if ($('#first-amount').is(':checked') && $('#consolidate-debt').is(':checked') ||
    $('#second-amount').is(':checked') && $('#consolidate-debt').is(':checked')) {
    // hide all fieldsets
    $('fieldset').removeClass('active');
    // show results fieldset with Personal Loan, Line of Credit
    $('.results').addClass('active');
    $('.results .personal-loan').css({
     'display': 'block'
    });
    $('.results .line-of-credit').css({
     'display': 'block'
    });
    $('.disclosure-container').css({
     'display': 'block'
    });
    $('.one-disclosure, .two-disclosure, .three-disclosure').show();
   }
   // Branch flow
   /* Consolidate -> "Southern States" -> Access to Funds -> Borrow Amount ->
  3rd option or 4th option or 5th option -> Home collateral... */
   else if ($('#third-amount').is(':checked') && $('#consolidate-debt').is(':checked') ||
    $('#fourth-amount').is(':checked') && $('#consolidate-debt').is(':checked') ||
    $('#fifth-amount').is(':checked') && $('#consolidate-debt').is(':checked')) {
    // hide all fieldsets
    $('fieldset').removeClass('active');
    // show Home collateral fieldset
    $('.home-collateral').addClass('active');
   }

   //***************** Finance a Purchase *************************
   // Branch flow
   /* Finance -> "Southern States" -> Access to Funds -> Borrow Amount ->
   1st option or 2nd option = Personal Loan, Line of Credit */
   else if ($('#first-amount').is(':checked') && $('#finance-purchase').is(':checked') ||
    $('#second-amount').is(':checked') && $('#finance-purchase').is(':checked')) {
    // hide all fieldsets
    $('fieldset').removeClass('active');
    // show results fieldset with Personal Loan, Line of Credit
    $('.results').addClass('active');
    $('.results .personal-loan').css({
     'display': 'block'
    });
    $('.results .line-of-credit').css({
     'display': 'block'
    });
    $('.disclosure-container').css({
     'display': 'block'
    });
    $('.one-disclosure, .two-disclosure, .three-disclosure').show();
   }
   // Branch flow
   /* Finance -> "Southern States" -> Access to Funds -> Borrow Amount ->
   3rd option or 4th option or 5th option -> Home collateral... */
   else if ($('#third-amount').is(':checked') && $('#finance-purchase').is(':checked') ||
    $('#fourth-amount').is(':checked') && $('#finance-purchase').is(':checked') ||
    $('#fifth-amount').is(':checked') && $('#finance-purchase').is(':checked')) {
    // hide all fieldsets
    $('fieldset').removeClass('active');
    // show Home collateral fieldset
    $('.home-collateral').addClass('active');
   }

   //***************** Unexpected expense (emergency) *************************
   // Branch flow
   /* Emergency -> "Southern States" -> -> Borrow Amount ->
   1st option = Personal Loan, Truist Ready now loan, Line of Credit */
   else if ($('#first-amount').is(':checked') && $('#emergency').is(':checked')) {
    // hide all fieldsets
    $('fieldset').removeClass('active');
    // show results with Personal Loan, Truist Ready now loan, Line of Credit
    $('.results').addClass('active');
    $('.results .personal-loan').css({
     'display': 'block'
    });
    $('.results .personl-loan .card-title h3').text('Personal loan');
    $('.results .line-of-credit').css({
     'display': 'block'
    });
    $('.results .truist-ready-now').css({
     'display': 'block'
    });
    $('.disclosure-container').css({
     'display': 'block'
    });
    $('.one-disclosure, .two-disclosure, .three-disclosure, .six-disclosure').show();
   }
   // Branch flow
   /* Emergency -> "Southern States" -> Borrow Amount ->
   2nd option or 3rd option or fourth option or fifth option = Personal Loan, Line of Credit */
   else if ($('#second-amount').is(':checked') && $('#emergency').is(':checked') ||
    $('#third-amount').is(':checked') && $('#emergency').is(':checked') ||
    $('#fourth-amount').is(':checked') && $('#emergency').is(':checked') ||
    $('#fifth-amount').is(':checked') && $('#emergency').is(':checked')) {
    // hide all fieldsets
    $('fieldset').removeClass('active');
    // results with Personal Loan, Line of Credit
    $('.results').addClass('active');
    $('.results .personal-loan').css({
     'display': 'block'
    });
    $('.results .line-of-credit').css({
     'display': 'block'
    });
    $('.disclosure-container').css({
     'display': 'block'
    });
    $('.one-disclosure, .two-disclosure, .three-disclosure').show();
   }
  });

  // The form branches at this point, depending on the type of access selection
  $('.home-collateral .next').on('click', function () {
   let i;
   for (i = 0; i < northern.length; i++) {
    //***************** Consolidate *************************
    // Branch flow
    // Consolidate -> California -> yes (home collateral) = Heloc
    if ($('#consolidate-debt').is(':checked') && $('#state').val() == 'CA' && $('#yes').is(':checked')) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show results fieldset with HELOC
     $('.results').addClass('active');
     $('.results .heloc').css({
      'display': 'block'
     });
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.four-disclosure, .five-disclosure').show();
    }
    // Branch flow
    // Consolidate -> California -> no (home collateral) = Lightstream (Lightstream Credit Card Debt Consolidation Loan)
    else if ($('#consolidate-debt').is(':checked') && $('#state').val() == 'CA' && $('#no').is(':checked')) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show resutls fieldset with Lightstream (Lightstream Credit Card Debt Consolidation Loan)
     $('.results').addClass('active');
     $('.results .lightstream-ccdc').css({
      'display': 'block'
     });
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.eight-disclosure').show();
    }
    // Branch flow
    // Consolidate -> "Southern States" yes (home collateral) -> = HELOC, Personal Loan, Personal Line of Credit
    else if ($('#consolidate-debt').is(':checked') && $('#yes').is(':checked')) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show results fieldset with Personal Loan, Line of Credit, HELOC
     $('.results').addClass('active');
     $('.results .personal-loan').css({
      'display': 'block'
     });
     $('.results .line-of-credit').css({
      'display': 'block'
     });
     $('.results .heloc').css({
      'display': 'block'
     });
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.one-disclosure, .two-disclosure, .three-disclosure, .four-disclosure, .five-disclosure').show();
    }
    // Branch flow
    // Consolidate -> "Southern States" no (home collateral) -> = Personal Loan, Personal Line of Credit
    else if ($('#consolidate-debt').is(':checked') && $('#no').is(':checked')) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show results fieldset with Personal Loan, Line of Credit
     $('.results').addClass('active');
     $('.results .personal-loan').css({
      'display': 'block'
     });
     $('.results .line-of-credit').css({
      'display': 'block'
     });
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.one-disclosure, .two-disclosure, .three-disclosure').show();
    }

    //***************** Finance a Purchase *************************
    // Branch flow
    // Finance -> California -> yes (home collateral) = Heloc
    if ($('#finance-purchase').is(':checked') && $('#state').val() == 'CA' && $('#yes').is(':checked')) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show results fieldset with HELOC
     $('.results').addClass('active');
     $('.results .heloc').css({
      'display': 'block'
     });
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.four-disclosure, .five-disclosure').show();
    }
    // Branch flow
    // Finance -> California -> No (home collateral) = Lightstream
    else if ($('#finance-purchase').is(':checked') && $('#state').val() == 'CA' && $('#no').is(':checked')) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show resutls fieldset with Lightstream (Lightstream Credit Card Debt Consolidation Loan)
     $('.results').addClass('active');
     $('.results .lightstream-ccdc').css({
      'display': 'block'
     });
     // $('.results .lightstream .card-title h3').text('Lightstream Credit Card Debt Consolidation Loan');
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.eight-disclosure').show();
    }
    // Branch flow
    // Finance -> yes (home collateral) -> "Southern States" = HELOC, Personal Loan, Personal Line of Credit
    else if ($('#finance-purchase').is(':checked') && $('#yes').is(':checked') && $('#state').val() == southern[i]) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show results with HELOC, Personal Loan, Personal Line of Credit
     $('.results').addClass('active');
     $('.results .personal-loan').css({
      'display': 'block'
     });
     $('.results .line-of-credit').css({
      'display': 'block'
     });
     $('.results .heloc').css({
      'display': 'block'
     });
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.one-disclosure, .two-disclosure, .three-disclosure, .four-disclosure, .five-disclosure').show();
    }
    // Branch flow
    // Finance -> no (home collateral) -> "Southern States" = Personal Loan, Personal Line of Credit
    else if ($('#finance-purchase').is(':checked') && $('#no').is(':checked') && $('#state').val() == southern[i]) {
     // hide all fieldsets
     $('fieldset').removeClass('active');
     // show results with Personal Loan, Personal Line of Credit
     $('.results').addClass('active');
     $('.results .personal-loan').css({
      'display': 'block'
     });
     $('.results .line-of-credit').css({
      'display': 'block'
     });
     $('.disclosure-container').css({
      'display': 'block'
     });
     $('.one-disclosure, .two-disclosure, .three-disclosure').show();
    }
   }

   //***************** Unexpected Expense (Emergency) *************************
   // Branch flow
   // Emergency -> California -> yes (home collateral) = Heloc
   if ($('#emergency').is(':checked') && $('#state').val() == 'CA' && $('#yes').is(':checked')) {
    //hide all fieldsets
    $('fieldset').removeClass('active');
    // show results with HELOC
    $('.results').addClass('active');
    $('.results .heloc').css({
     'display': 'block'
    });
    $('.disclosure-container').css({
     'display': 'block'
    });
    $('.four-disclosure, .five-disclosure').show();
   }
   // Branch flow
   // Emergency -> California -> no (home collateral) = Lightstream (Lightstream Credit Card Debt Consolidation Loan)
   else if ($('#emergency').is(':checked') && $('#state').val() == 'CA' && $('#no').is(':checked')) {
    // hide all fieldsets
    $('fieldset').removeClass('active');
    // Show results with Lightstream (Lightstream Credit Card Debt Consolidation Loan)
    $('.results').addClass('active')
    $('.results .lightstream-ccdc').css({
     'display': 'block'
    });
    // $('.results .lightstream .card-title h3').text('Lightstream Credit Card Debt Consolidation Loan');
    $('.disclosure-container').css({
     'display': 'block'
    });
    $('.eight-disclosure').show();
   }
  });

  // previous button sequence for California
  $('.home-collateral .previous').on('click', function () {
   if ($('#state').val() == 'CA' && $('#consolidate-debt').is(':checked') || $('#finance-purchase').is(':checked') || $('#emergency').is(':checked')) {
    // hide all fieldsets
    $('fieldset').removeClass('active');
    // show select state fieldset
    $('.state-selection').addClass('active');
   } else {
    // hide all fieldsets
    $('fieldset').removeClass('active');
    // show regularly sequenced fieldset
    $('.borrow-amount').addClass('active');
   }
  });


  $('.personal-loan .apparition').on('click', function () {
   $('.modal-dialog').append(' <div class="modal-content card">' +
    '<div class="modal-header card-title">' +
    '<h3 class="modal-title" id="quick-view-label">' +
    'Personal Loan' +
    '</h3 > ' +
    //'Apply online, by phone, or in a branch.' +
    '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
    '<span aria-hidden="true">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="22.673" height="22.674" viewBox="0 0 22.673 22.674">' +
    '<g id="x_icon" data-name="x icon" transform="translate(101.414 1.415)">' +
    '<path id="Path_143" data-name="Path 143" d="M-2222.793-17767.182l19.844,19.846" transform="translate(2122.793 17767.182)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '<path id="Path_144" data-name="Path 144" d="M0,0,19.844,19.845" transform="translate(-100 19.845) rotate(-90)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '</g>' +
    '</svg>' +
    '</span>' +
    '</button>' +
    '</div>' +
    '<div class="modal-body card-body">' +
    '<!--<h4 class="hide-for-large">' +
    'Lorem ipsum' +
    '</h4 > ' +
    '<h5 class="hide-for-large">' +
    'Lorem ipsum dolor sit amet bayoun' +
    '</h5>--> ' +
    '<p>' +
    'Get access to the money you need—quickly, and without collateral. A Truist Personal Loan is great for consolidating high-interest debt to save money—and boost your financial confidence—as you pay it down.' +
    '<br>' +
    'Have other plans? Pay for home improvements, take your family on a well-deserved getaway, or finance your next large purchase. Use it for what’s important to you.' +
    '</p > ' +
    '<h5 class="benefits hide-for-large">' +
    'Benefits or features:' +
    '</h5>' +
    '<ul class="checkpoint">' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Loans from $3,500' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Expect a quick decision—sometimes in just minutes' +
    '<sup><a class="disc-link-two-modal" href="#two">2</a></sup>' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Fixed interest rates and terms work with your budget' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'No origination fees—no matter the size of your loan' +
    '</span > ' +
    '</li>' +
    '</ul>' +
    '<a class="modal-cta" title="apply now" target="_blank" href="https://lending.digitalcommerce.truist.com/product/R02">' +
    'Apply now >' +
    '</a > ' +
    '<br>' +
    '<a class="modal-cta" title="Truist Personal Loan" target="_self"  href="/loans/personal-loans?tru-slide-select=content-mobile-truisttabs-1881641994*0*nav-bar-mobile-truisttabs-1881641994&tru-tab-select=item-1--truisttabs-1881641994!a*nav-truisttabs-1881641994">' +
    'View details >' +
    '</a > ' +
    '<p class="disclosure two-disclosure clearfix">' +
    '<sup id="two">' +
    '2' +
    '</sup>&nbsp;' +
    'Your loan officer will provide you with guidance on what documentation is needed to help expedite the approval process. You may be able to fund your loan today if today is a banking business day.' +
    '</p>' +
    '</div>' +
    '</div>')
   $('.modal-dialog .modal-body').on('click', '.disc-link-two-modal', function () {
    $('.modal-dialog .disclosure').removeClass('data-focus');
    $('.modal-dialog .two-disclosure').addClass('data-focus');
   });
  });

  $('.line-of-credit .apparition').on('click', function () {
   $('.modal-dialog').append(' <div class="modal-content card">' +
    '<div class="modal-header card-title">' +
    '<h3 class="modal-title" id="quick-view-label">' +
    'Personal Line of Credit' +
    '</h3 > ' +
    //'Apply by phone or in person.' +
    '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
    '<span aria-hidden="true">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="22.673" height="22.674" viewBox="0 0 22.673 22.674">' +
    '<g id="x_icon" data-name="x icon" transform="translate(101.414 1.415)">' +
    '<path id="Path_143" data-name="Path 143" d="M-2222.793-17767.182l19.844,19.846" transform="translate(2122.793 17767.182)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '<path id="Path_144" data-name="Path 144" d="M0,0,19.844,19.845" transform="translate(-100 19.845) rotate(-90)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '</g>' +
    '</svg>' +
    '</span>' +
    '</button>' +
    '</div>' +
    '<div class="modal-body card-body">' +
    //'<h4 class="hide-for-large">' +
    //'Lorem ipsum' +
    //'</h4 > ' +
    //'<h5 class="hide-for-large">' +
    //'Lorem ipsum dolor sit amet bayoun' +
    //'</h5>' +
    '<p>' +
    'With a Truist Personal Line of Credit, you’ll be prepared when life presents opportunities or even the unexpected. As a lower-cost alternative to credit cards, it’s also perfect for simply boosting your buying power—no collateral needed.' +
    '</p > ' +
    '<h5 class="benefits hide-for-large">' +
    'Benefits or features:' +
    '</h5>' +
    '<ul class="checkpoint">' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Credit lines from $5,000' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Expect a quick decision—sometimes in just minutes' +
    '<sup><a class="disc-link-two-modal" href="#two">2</a></sup>' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'No collateral is required and rates are lower than most credit cards' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Easily transfer funds directly to your checking account' +
    '</span > ' +
    '</li>' +
    '</ul>' +
    //'<a class="modal-cta" title="" href="/locations">' +
    //'Find a branch >' +
    //'</a > ' +
    //'</br>' +
    '<a class="modal-cta" title="Personal Line of Credit" href="/loans/personal-loans?tru-slide-select=content-mobile-truisttabs-1881641994*2*nav-bar-mobile-truisttabs-1881641994&tru-tab-select=item-3--truisttabs-1881641994!a*nav-truisttabs-1881641994">' +
    'View details and apply >' +
    '</a > ' +
    '<p class="disclosure two-disclosure clearfix">' +
    '<sup id="two">' +
    '2' +
    '</sup>&nbsp;' +
    'Your loan officer will provide you with guidance on what documentation is needed to help expedite the approval process. You may be able to fund your loan today if today is a banking business day.' +
    '</p>' +
    '</div>' +
    '</div>')
   $('.modal-dialog .modal-body').on('click', '.disc-link-two-modal', function () {
    $('.modal-dialog .disclosure').removeClass('data-focus');
    $('.modal-dialog .two-disclosure').addClass('data-focus');
   });
  });

  $('.heloc .apparition').on('click', function () {
   $('.modal-dialog').append(' <div class="modal-content card">' +
    '<div class="modal-header card-title">' +
    '<h3 class="modal-title" id="quick-view-label">' +
    'Home Equity Line of Credit' +
    '</h3 > ' +
    //'Apply online, by phone, or in a branch.' +
    '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
    '<span aria-hidden="true">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="22.673" height="22.674" viewBox="0 0 22.673 22.674">' +
    '<g id="x_icon" data-name="x icon" transform="translate(101.414 1.415)">' +
    '<path id="Path_143" data-name="Path 143" d="M-2222.793-17767.182l19.844,19.846" transform="translate(2122.793 17767.182)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '<path id="Path_144" data-name="Path 144" d="M0,0,19.844,19.845" transform="translate(-100 19.845) rotate(-90)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '</g>' +
    '</svg>' +
    '</span>' +
    '</button>' +
    '</div>' +
    '<div class="modal-body card-body">' +
     //'<h4 class="hide-for-large">' +
     //'Lorem ipsum' +
     //'</h4 > ' +
     //'<h5 class="hide-for-large">' +
     //'Lorem ipsum dolor sit amet bayoun' +
     //'</h5>' +
    '<p>' +
    'Put your home to work for you with a low-rate Home Equity Line of Credit. You’ll have easy access to cash when you need it, so you can be ready for the opportunities and challenges that lie ahead. A HELOC can offer lower rates than a personal loan. Plus, with each draw, you can choose the repayment option that works best for you.' +
    '</p > ' +
    '<h5 class="benefits hide-for-large">' +
    'Benefits or features:' +
    '</h5>' +
    '<ul class="checkpoint">' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Line amounts from $10,000 to $500,000' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Repayment options are flexible and rates are lower than most personal loans' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Expert guidance is available when you have questions' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'No closing cost option <sup><a class="disc-link-five-modal" href="#five">5</a></sup>&nbsp;and you can even lock in a fixed rate and term' +
    '</span > ' +
    '</li>' +
    '</ul>' +
    '<a class="modal-cta" title="apply now" target="_blank" href="https://lending.digitalcommerce.truist.com/product/R03">' +
    'Apply now >' +
    '</a > ' +
    '</br>' +
    '<a class="modal-cta" title="HELOC" target="_self" href="/loans/heloc">' +
    'View details >' +
    '</a > ' +
    '<p class="disclosure five-disclosure clearfix">' +
    '<sup id="five">' +
    '5' +
    '</sup>&nbsp;' +
    'The advertised rate will vary if the client chooses for the bank to pay their closing costs, which is an option in some states if the requested loan amount is less than or equal to $500,000. Other fees may be charged at origination, closing or subsequent to closing, ranging from $0 to $10,000, and may vary by state. If you pay off your Truist Home Equity Line of Credit within 36 months from the date of loan origination, you may be required to remit any closing costs Truist paid on your behalf. There is a $50 annual fee in AL, FL, GA, IN, KY, NJ, and OH. This rate offer may change at any time.' +
    '</p>' +
    '</div>' +
    '</div>')
   $('.modal-dialog .modal-body').on('click', '.disc-link-five-modal', function () {
    $('.modal-dialog .disclosure').removeClass('data-focus');
    $('.modal-dialog .five-disclosure').addClass('data-focus');
   });
  });

  $('.truist-auto-loan .apparition').on('click', function () {
   $('.modal-dialog').append(' <div class="modal-content card">' +
    '<div class="modal-header card-title">' +
    '<h3 class="modal-title" id="quick-view-label">' +
    //'Truist Auto Loan' +
    'Auto Loan' +
    '</h3 > ' +
    //'Apply by phone or in a branch.' +
    '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
    '<span aria-hidden="true">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="22.673" height="22.674" viewBox="0 0 22.673 22.674">' +
    '<g id="x_icon" data-name="x icon" transform="translate(101.414 1.415)">' +
    '<path id="Path_143" data-name="Path 143" d="M-2222.793-17767.182l19.844,19.846" transform="translate(2122.793 17767.182)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '<path id="Path_144" data-name="Path 144" d="M0,0,19.844,19.845" transform="translate(-100 19.845) rotate(-90)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '</g>' +
    '</svg>' +
    '</span>' +
    '</button>' +
    '</div>' +
    '<div class="modal-body card-body">' +
     //'<h4 class="hide-for-large">' +
     //'Lorem ipsum' +
     //'</h4 > ' +
     //'<h5 class="hide-for-large">' +
     //'Lorem ipsum dolor sit amet bayoun' +
     //'</h5>' +
    '<p>' +
    'Purchase, refinance or buy out your lease—a Truist Auto Loan puts it within reach. Applying is a breeze and your decision comes fast, usually in 10 minutes or less. Get the money you need today at a rate that works for you.' +
    '</p > ' +
    '<h5 class="benefits hide-for-large">' +
    'Benefits or features:' +
    '</h5>' +
    '<ul class="checkpoint">' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Loans starting at $3,500' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Fast decisions and same-day funding let you shop with confidence' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Loans available for dealer or individual sales' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'A trusted auto loan specialist can help you find the terms and payment that best fit your budget' +
    '</span > ' +
    '</li>' +
    '</ul>' +
    //'<a class="modal-cta" title="" target="_self" href="/locations">' +
    //'Find a branch >' +
    //'</a > ' +
    //'</br>' +
    //'<a class="modal-cta" title="" href="tel:844-4878478">Call us: 844-4TRUIST</a>' +
    //'<br>' +
    '<a class="modal-cta" title="Auto loans" target="_self" href="/loans/auto-loans">' +
    'View details and apply >' +
    '</a > ' +
    '</div>' +
    '</div>')
  });

  $('.lightstream-hi .apparition').on('click', function () {
   $('.modal-dialog').append(' <div class="modal-content card">' +
    '<div class="modal-header card-title">' +
    '<h3 class="modal-title" id="quick-view-label">' +
    'Home Improvement Loan' +
    '</h3 > ' +
    'Get fast, easy home improvement financing.' +
    '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
    '<span aria-hidden="true">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="22.673" height="22.674" viewBox="0 0 22.673 22.674">' +
    '<g id="x_icon" data-name="x icon" transform="translate(101.414 1.415)">' +
    '<path id="Path_143" data-name="Path 143" d="M-2222.793-17767.182l19.844,19.846" transform="translate(2122.793 17767.182)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '<path id="Path_144" data-name="Path 144" d="M0,0,19.844,19.845" transform="translate(-100 19.845) rotate(-90)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '</g>' +
    '</svg>' +
    '</span>' +
    '</button>' +
    '</div>' +
    '<div class="modal-body card-body">' +
     //'<h4 class="hide-for-large">' +
     //'Lorem ipsum' +
     //'</h4 > ' +
     //'<h5 class="hide-for-large">' +
     //'Lorem ipsum dolor sit amet bayoun' +
     //'</h5>' +
     //'<p>' +
    'LightStream offers low, fixed rates to finance practically any home improvement project on your to-do list. You can get funds directly deposited into your account to finance your entire indoor and outdoor project. Apply online in minutes and get a response as soon as the day you apply.' +
    '<sup><a class="disc-link-nine-modal" href="#nine">9</a></sup>' +
    '</p > ' +
    '<h5 class="benefits hide-for-large">' +
    'Benefits or features:' +
    '</h5>' +
    '<ul class="checkpoint">' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'No appraisal or home equity required' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Funds from $5,000 to $100,00 available' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'No fees or prepayment penalties' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Competitive, fixed rates' +
    '</span > ' +
    '</li>' +
    '</ul>' +
    '<a class="modal-cta" title="apply now for a Lightstream Home Improvement Loan" target="_blank" href="https://www.lightstream.com/?fact=20172">' +
    'Apply now >' +
    '</a > ' +
    '</br>' +
    '<a class="modal-cta" title="Lightstream Home Improvement" target="_blank" href="https://www.lightstream.com/?fact=20165">' +
    'View details >' +
    '</a > ' +
    '<p class="disclosure nine-disclosure clearfix">' +
    '<sup id="nine">' +
    '9' +
    '</sup>&nbsp;' +
    'You can fund your loan today if today is a banking business day, your application is approved, and you complete the following steps by 2:30 p.m. Eastern time: (1) review and electronically sign your loan agreement; (2) provide us with your funding preferences and relevant banking information; and (3) complete the final verification process.' +
    '</p>' +
    '</div>' +
    '</div>')
   $('.modal-dialog .modal-body').on('click', '.disc-link-nine-modal', function () {
    $('.modal-dialog .disclosure').removeClass('data-focus');
    $('.modal-dialog .nine-disclosure').addClass('data-focus');
   });
  });

  $('.lightstream-ccdc .apparition').on('click', function () {
   $('.modal-dialog').append(' <div class="modal-content card">' +
    '<div class="modal-header card-title">' +
    '<h3 class="modal-title" id="quick-view-label">' +
    'Credit Card Consolidation Loan' +
    '</h3 > ' +
    'Consolidate high-interest credit card debt.' +
    '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
    '<span aria-hidden="true">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="22.673" height="22.674" viewBox="0 0 22.673 22.674">' +
    '<g id="x_icon" data-name="x icon" transform="translate(101.414 1.415)">' +
    '<path id="Path_143" data-name="Path 143" d="M-2222.793-17767.182l19.844,19.846" transform="translate(2122.793 17767.182)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '<path id="Path_144" data-name="Path 144" d="M0,0,19.844,19.845" transform="translate(-100 19.845) rotate(-90)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '</g>' +
    '</svg>' +
    '</span>' +
    '</button>' +
    '</div>' +
    '<div class="modal-body card-body">' +
     //'<h4 class="hide-for-large">' +
     //'Lorem ipsum' +
     //'</h4 > ' +
     //'<h5 class="hide-for-large">' +
     //'Lorem ipsum dolor sit amet bayoun' +
     //'</h5>' +
    '<p>' +
    'LightStream offers low, fixed rates to consolidate up to $100,000 of high-interest credit card debt. You could potentially save on interest, pay down balances faster and know exactly when your debt will be paid off.  Apply online in just minutes and get one-step closer to regaining control of your finances.' +
    '</p > ' +
    '<h5 class="benefits hide-for-large">' +
    'Benefits or features:' +
    '</h5>' +
    '<ul class="checkpoint">' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Lock in low, fixed rates' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'No collateral required, and no fees or prepayment penalties' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Consolidate multiple bills into a single, monthly payment' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Fast, easy online application that only takes minutes' +
    '</span > ' +
    '</li>' +
    '</ul>' +
    '<a class="modal-cta" title="apply for a LightStream Credit Card Debt Consoidation Loan" target="_blank" href="https://www.lightstream.com/?fact=20173">' +
    'Apply now >' +
    '</a > ' +
    '</br>' +
    '<a class="modal-cta" title="Lightstream Credit Card Debt Consolidation" target="_blank" href="https://www.lightstream.com/?fact=20167">' +
    'View details >' +
    '</a > ' +
    '</div>' +
    '</div>')
  });

  $('.lightstream-al .apparition').on('click', function () {
   $('.modal-dialog').append(' <div class="modal-content card">' +
    '<div class="modal-header card-title">' +
    '<h3 class="modal-title" id="quick-view-label">' +
    'Auto Loan' +
    '</h3 > ' +
    'Finance a used, new, or classic car.' +
    '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
    '<span aria-hidden="true">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="22.673" height="22.674" viewBox="0 0 22.673 22.674">' +
    '<g id="x_icon" data-name="x icon" transform="translate(101.414 1.415)">' +
    '<path id="Path_143" data-name="Path 143" d="M-2222.793-17767.182l19.844,19.846" transform="translate(2122.793 17767.182)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '<path id="Path_144" data-name="Path 144" d="M0,0,19.844,19.845" transform="translate(-100 19.845) rotate(-90)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '</g>' +
    '</svg>' +
    '</span>' +
    '</button>' +
    '</div>' +
    '<div class="modal-body card-body">' +
     //'<h4 class="hide-for-large">' +
     //'Lorem ipsum' +
     //'</h4 > ' +
     //'<h5 class="hide-for-large">' +
     //'Lorem ipsum dolor sit amet bayoun' +
     //'</h5>' +
    '<p>' +
    'Get a low, fixed rate and funds from $5,000 to $100,000 to finance the used, new, or classic auto of your choice. If approved, you’ll get funds directly deposited into your account so you can negotiate a great deal as a cash buyer.' +
    '</p > ' +
    '<h5 class="benefits hide-for-large">' +
    'Benefits or features:' +
    '</h5>' +
    '<ul class="checkpoint">' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Get funds as soon as the day you apply<sup><a class="disc-link-nine-modal" href="#nine">9</a></sup>' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'No collateral, fees or prepayment penalties' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Fast, easy online application' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Flexible terms available' +
    '</span > ' +
    '</li>' +
    '</ul>' +
    '<a class="modal-cta" title="apply for a LightStream Auto Loan" target="_blank" href="https://www.lightstream.com/?fact=20174">' +
    'Apply now >' +
    '</a > ' +
    '</br>' +
    '<a class="modal-cta" title="Lightstream Auto Loan" target="_blank" href="https://www.lightstream.com/?fact=20169">' +
    'View details >' +
    '</a > ' +
    '<p class="disclosure nine-disclosure clearfix">' +
    '<sup id="nine">' +
    '9' +
    '</sup>&nbsp;' +
    'You can fund your loan today if today is a banking business day, your application is approved, and you complete the following steps by 2:30 p.m. Eastern time: (1) review and electronically sign your loan agreement; (2) provide us with your funding preferences and relevant banking information; and (3) complete the final verification process.' +
    '</p>' +
    '</div>' +
    '</div>')
   $('.modal-dialog .modal-body').on('click', '.disc-link-nine-modal', function () {
    $('.modal-dialog .disclosure').removeClass('data-focus');
    $('.modal-dialog .nine-disclosure').addClass('data-focus');
   });
  });

  $('.lightstream-upl .apparition').on('click', function () {
   $('.modal-dialog').append(' <div class="modal-content card">' +
    '<div class="modal-header card-title">' +
    '<h3 class="modal-title" id="quick-view-label">' +
    'Unsecured personal loan' +
    '</h3 > ' +
    'Fast, easy financing for almost anything.' +
    '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
    '<span aria-hidden="true">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="22.673" height="22.674" viewBox="0 0 22.673 22.674">' +
    '<g id="x_icon" data-name="x icon" transform="translate(101.414 1.415)">' +
    '<path id="Path_143" data-name="Path 143" d="M-2222.793-17767.182l19.844,19.846" transform="translate(2122.793 17767.182)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '<path id="Path_144" data-name="Path 144" d="M0,0,19.844,19.845" transform="translate(-100 19.845) rotate(-90)" fill="#fff" stroke="#2e1a47" stroke-linecap="round" stroke-width="2"></path>' +
    '</g>' +
    '</svg>' +
    '</span>' +
    '</button>' +
    '</div>' +
    '<div class="modal-body card-body">' +
     //'<h4 class="hide-for-large">' +
     //'Lorem ipsum' +
     //'</h4 > ' +
     //'<h5 class="hide-for-large">' +
     //'Lorem ipsum dolor sit amet bayoun' +
     //'</h5>' +
    '<p>' +
    'When you have good credit, you deserve a low-interest, fixed-rate loan. LightStream makes it easy to finance practically anything with a simple online application process. The unsecured LightStream loan has no fees or prepayment penalties. There are also no appraisals or home equity requirements. ' +
    '</p > ' +
    '<h5 class="benefits hide-for-large">' +
    'Benefits or features:' +
    '</h5>' +
    '<ul class="checkpoint">' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Competitive, fixed-rate loan' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Get funds from $5,000 to $100,000' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Funds deposited directly into your account' +
    '</span > ' +
    '</li>' +
    '<li>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">' +
    '<path id="Path_9847" data-name="Path 9847" d="M7.5,20a1.5,1.5,0,0,1-1.061-.44l-6-6A1.5,1.5,0,1,1,2.561,11.44l4.94,4.94L21.44,2.439a1.5,1.5,0,1,1,2.121,2.121l-15,15A1.5,1.5,0,0,1,7.5,20Z" transform="translate(0 -2)" fill="#7c6992"></path>' +
    '</svg>' +
    '<span>' +
    'Apply online from almost anywhere' +
    '</span > ' +
    '</li>' +
    '</ul>' +
    '<a class="modal-cta" title="apply now for a LightStream Unsecured Personal Loan" target="_blank" href="https://www.lightstream.com/?fact=20175 ">' +
    'Apply now >' +
    '</a > ' +
    '</br>' +
    '<a class="modal-cta" title="LightStream Unsecured Personal Loan" target="_blank" href="https://www.lightstream.com/?fact=20171">' +
    'View details >' +
    '</a > ' +
    '</div>' +
    '</div>')
  });


  // Inernal scrolling page links
  // apply data-focus attribute to target for styling and expand the accordion if closed
  $('.disc-link-one').on('click', function () {
   if ($('.disclosure-container a').removeAttr('aria-expanded', 'false')) {
    $('.disclosure-container a').attr('aria-expanded', 'true');
    $('#disclosure').addClass('show');
   }
   $('.disclosure').removeClass('data-focus');
   $('.one-disclosure').addClass('data-focus');
  });

   $('.disc-link-two').on('click', function () {
    if ($('.disclosure-container a').removeAttr('aria-expanded', 'false')) {
     $('.disclosure-container a').attr('aria-expanded', 'true');
     $('#disclosure').addClass('show');
    }
    $('.disclosure').removeClass('data-focus');
    $('.two-disclosure').addClass('data-focus');
   });

  $('.disc-link-three').on('click', function () {
   if ($('.disclosure-container a').removeAttr('aria-expanded', 'false')) {
    $('.disclosure-container a').attr('aria-expanded', 'true');
    $('#disclosure').addClass('show');
   }
   $('.disclosure').removeClass('data-focus');
   $('.three-disclosure').addClass('data-focus');
  });

   $('.disc-link-four').on('click', function () {
    if ($('.disclosure-container a').removeAttr('aria-expanded', 'false')) {
     $('.disclosure-container a').attr('aria-expanded', 'true');
     $('#disclosure').addClass('show');
    }
    $('.disclosure').removeClass('data-focus');
    $('.four-disclosure').addClass('data-focus');
   });

  $('.disc-link-five').on('click', function () {
   if ($('.disclosure-container a').removeAttr('aria-expanded', 'false')) {
    $('.disclosure-container a').attr('aria-expanded', 'true');
    $('#disclosure').addClass('show');
   }
   $('.disclosure').removeClass('data-focus');
   $('.five-disclosure').addClass('data-focus');
  });

  $('.disc-link-six').on('click', function () {
   if ($('.disclosure-container a').removeAttr('aria-expanded', 'false')) {
    $('.disclosure-container a').attr('aria-expanded', 'true');
    $('#disclosure').addClass('show');
   }
   $('.disclosure').removeClass('data-focus');
   $('.six-disclosure').addClass('data-focus');
  });

  $('.disc-link-seven').on('click', function () {
   if ($('.disclosure-container a').removeAttr('aria-expanded', 'false')) {
    $('.disclosure-container a').attr('aria-expanded', 'true');
    $('#disclosure').addClass('show');
   }
   $('.disclosure').removeClass('data-focus');
   $('.seven-disclosure').addClass('data-focus');
  });

  $('.disc-link-eight').on('click', function () {
   if ($('.disclosure-container a').removeAttr('aria-expanded', 'false')) {
    $('.disclosure-container a').attr('aria-expanded', 'true');
    $('#disclosure').addClass('show');
   }
   $('.disclosure').removeClass('data-focus');
   $('.eight-disclosure').addClass('data-focus');
  });

  $('.disc-link-nine').on('click', function () {
   if ($('.disclosure-container a').removeAttr('aria-expanded', 'false')) {
    $('.disclosure-container a').attr('aria-expanded', 'true');
    $('#disclosure').addClass('show');
   }
   $('.disclosure').removeClass('data-focus');
   $('.nine-disclosure').addClass('data-focus');
  });

  $('.disc-link-ten').on('click', function () {
   if ($('.disclosure-container a').removeAttr('aria-expanded', 'false')) {
    $('.disclosure-container a').attr('aria-expanded', 'true');
    $('#disclosure').addClass('show');
   }
   $('.disclosure').removeClass('data-focus');
   $('.ten-disclosure').addClass('data-focus');
  });

  $('.disc-link-eleven').on('click', function () {
   if ($('.disclosure-container a').removeAttr('aria-expanded', 'false')) {
    $('.disclosure-container a').attr('aria-expanded', 'true');
    $('#disclosure').addClass('show');
   }
   $('.disclosure').removeClass('data-focus');
   $('.eleven-disclosure').addClass('data-focus');
  });

  $('#quick-view').on('hidden.bs.modal', function (e) {
   $('.modal-content').remove();
  });
})();

