<div class="main-scroll-block">
   <div class="main-pad-block">
      
          ((TOP))

	<div class="dev-nw-gray-bg">
		<div class="dev-nw-gray"></div>
	</div>

<div class="main-mid-pad new-bottom-pages investors-nw on-boot" data-js="corporate_boot">
  <div class="new-left-menu-block" style="padding-top: 30px;">
    @set($e, 1)
    @foreach ($data as $page)
    <div class="new-left-menu-link investors" id="page-{{$e++}}">
      <div class="new-left-link-pad">{{{$page->title}}}</div>
    </div>
    @end
  </div>
  
  @set($e, 1)
  @foreach ($data as $page)
  <div class="new-right-content-block page-{{$e++}} hidden">
    <h1>{{{$page->title}}}</h1>
    {{ $page->getHtml() }}
  </div>
  @end
  
  <div class="clear"></div>
</div>

      ((BOTTOM))
	</div>
</div>
