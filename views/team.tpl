@foreach ($members as $user)
    <div class="team-person-block">
      <div class="team-person-avatar">
       <img alt="" src="{cmspath}/unsigned/{{{$user['avatar']}}}" />
      </div>
      <div class="team-person-name">
        {{{$user['name']}}}
      </div>
      <div class="team-person-occupation">
        {{{$user['role']}}}
      </div>
      <div class="team-social-bl">
        @if ($user['twitter'])
         <a href="{{{$user['twitter']}}}" target="_blank" rel="noreferrer" class="team-social-icon twitter"></a>
        @else
         <a href="" target="_blank" rel="noreferrer" class="team-social-icon twitter hidden"></a>
        @end
        @if ($user['linkedin'])
         <a href="{{{$user['linkedin']}}}" target="_blank" rel="noreferrer" class="team-social-icon linkedin"></a>
        @else
         <a href="" target="_blank" rel="noreferrer" class="team-social-icon linkedin hidden"></a>
        @end
      </div>
    </div>
@end
