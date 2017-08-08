<hr>
@foreach ($files as $file)
<div class="investors-pdf-block">
	<a href="" class="investors-pdf-download cms-asset-download" data-id="{{{$file->xid}}}">Download</a>
	@if (preg_match('/pdf/', $file->mime))
	    <div class="innametors-pdf-icon-bl">
	@else
	    <div class="">
	@end
		    <div class="investors-pdf-title">{{{ $file->name }}}</div>
		    <div class="investors-pdf-date">{{{ date("d F Y") }}}</div>
	    </div>
</div>
@end
<hr class="pdf-div">
