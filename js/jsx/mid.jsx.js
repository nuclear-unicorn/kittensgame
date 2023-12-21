/* global 

    $r
    $WMidPanel

*/

WMidPanel = React.createClass({
  render: function () {
    return $r(
      WTooltip,
      { body: "?" },
      $r("span", {
        dangerouslySetInnerHTML: {
          __html: $I("mid.buildings.tip")
        }
      })
    );
  }
});
