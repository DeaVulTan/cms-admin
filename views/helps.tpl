  <div class="main-scroll-block">
   <div class="main-pad-block">

      <div class="dev-nw-gray-bg">
        <div class="dev-nw-gray"></div>
      </div>
      
      <div class="main-mid-pad new-bottom-pages help-nw">
         <div class="new-left-menu-block">
            <div class="new-left-menu-link home active">
              <div class="new-left-menu-icon help-icon help-home">{{{ _t('Home') }}}</div>
            </div> 
            @foreach ($data as $i => $help)
            <div class="new-left-menu-link {{{$help->name()}}}">
              <div class="new-left-menu-icon help-icon help-{{{$help->name()}}}">{{{ _t($help->title) }}}</div>
            </div> 
            @end
         </div>
         
         <div class="new-right-content-block home">
           <h1 class="help-home-header">{{{_t('Welcome to the help centre')}}}</h1>
           <div class="blog-new-search">
                <input value="{{{_t('Search')}}}" class="help_search"/>
           </div>
           <div class="blog-new-div">
              <div></div>
           </div>
           <div class="help-short-block">
            <div class="dev-short-block left"> 
             <div class="new-affiliate-mid-header new-affiliate-bot-pad"> 
                <span class="red">{{{_t('Get support')}}}</span> 
             </div> 
             <div class="help-text-block"> 
                {{{ _t('If your question is not answered here, do not hesitate to contact us.')}}}
             </div> 
             <a href="mailto:support@mega.co.nz" class="dev-new-button"> {{{_t('Contact Support')}}} </a> 
             <div class="clear"></div> 
            </div>
            <div class="dev-short-block right"> 
             <div class="new-affiliate-mid-header new-affiliate-bot-pad"> 
               <span class="red">{{{_t('Popular Topics:')}}}</span> 
             </div>  
             @foreach ($data as $help)
                @if ($help->popularQuestion)
             <a href="#help/{{$help->name()}}" class="help-listing"> 
                {{{_t($help->popularQuestion)}}}
             </a><br>
                @end
             @end
            </div>
            <div class="clear"></div>
           </div>
           <div class="blog-new-div">
              <div></div>
           </div>
           <div class="new-affiliate-mid-header new-affiliate-bot-pad"> 
               <span class="red">{{{_t('Categories')}}}</span> 
           </div> 
           <div class="dev-short-block left help-nw-short-blocks"> 
                @set($i, 1)
                @foreach ($data as $help)
                    @if ($i++%2 == 1)
               <div class="help-block {{$help->name()}}">
                   <div class="help-short-icon {{$help->name()}}">
                    {{{_t($help->title)}}}
                   </div>
                   <div class="help-short-txt">
                   {{_t($help->description)}}
                   </div>
               </div>
                    @end
                @end
           </div>
           <div class="dev-short-block right help-nw-short-blocks"> 
                @set($i, 1)
                @foreach ($data as $help)
                    @if ($i++%2 == 0)
               <div class="help-block {{{$help->name()}}}">
                   <div class="help-short-icon {{{$help->name()}}}">
                    {{{_t($help->title)}}}
                   </div>
                   <div class="help-short-txt">
                   {{_t($help->description)}}
                   </div>
               </div>
                    @end
                @end
           </div>
           <div class="clear"></div>
         </div>
         
         <div class="new-right-content-block help-info-pages hidden help2">
            @foreach ($data as $help)
            <div id="section-{{{$help->name()}}}" class="hidden sections">
                <h1 class="help-home-header">Help Centre - <span class="red">{{{_t($help->title)}}}</span></h1>

                @foreach ($help->questions as $question)
                    <h2>{{{$question->question}}}</h2>
                    {{ $question->answer }}
                @end
            </div>
            @end
         </div>
         
         <div class="clear"></div>
      </div>
      
    
      ((BOTTOM))
    
  </div>
  </div>
