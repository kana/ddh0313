$(document).ready(function () {
  $('#columns .tweets').empty();  // Remove dummy content.

  $('.not-signed-in #the-sign-in-menu').popover({
    placement: 'below',
    trigger: 'manual'
  }).popover('show');
});

// __END__  {{{1
// vim: expandtab shiftwidth=2 softtabstop=2
// vim: foldmethod=marker
