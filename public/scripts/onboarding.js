$(document).ready(function () {
	var user = {};

	$.ajax({
	  type: 'GET',
	  url: '/api/1/settings/' + Apunto.config.userId
	}).done(function (res) {
		
		$.extend(user, res.user);

		if (!user.onboarding && !user.name && !user.companyName) {
			setTimeout(function () {
				$('.calendar').hide();
				$('.onboarding').show(300);
			}, 2000);
		}

	}).fail(function (err) {
		
		console.log(err.responseText);

	});

	$('.onboarding-form').on('submit', function (e) {

		e.preventDefault();

		var userDetails = $(this).serializeObject();

		$.extend(user, userDetails);


		$.ajax({
		  type: 'POST',
		  url: '/onboarding',
		  data: user
		}).done(function (res) {

			// Move to next step
			$('.onboarding .step1').hide();
			$('.onboarding .step2').show();

		}).fail(function (err) {
			
			// TODO error handling
			console.log(err.responseText);

		});


	});

	$('body').on('click', '.hide-onboarding', function (e) {
		e.preventDefault();
		window.location.reload();
	})

	
});