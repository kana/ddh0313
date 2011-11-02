$(document).ready(function () {
  $('#columns .tweets').empty();  // Remove dummy content.

  $('.not-signed-in #the-sign-in-menu').popover({
    placement: 'below',
    trigger: 'manual'
  }).popover('show');

  var update_character_count = function () {
    $('#character-count').text(140 - $(this).val().length);  // FIXME
  };
  $('#status')
    .keydown(update_character_count)
    .keyup(update_character_count);
});

// __END__  {{{1
// vim: expandtab shiftwidth=2 softtabstop=2
// vim: foldmethod=marker
