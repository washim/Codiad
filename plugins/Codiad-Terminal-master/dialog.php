<?php

    /*
    *  Copyright (c) Codiad & Kent Safranski (codiad.com), distributed
    *  as-is and without warranty under the MIT License. See 
    *  [root]/license.txt for more. This information must remain intact.
    */


    require_once('../../common.php');
    
    //////////////////////////////////////////////////////////////////
    // Verify Session or Key
    //////////////////////////////////////////////////////////////////
    
    checkSession();
    
?>
<style>#terminal { border: 1px solid #2b2b2b; }</style>
<iframe id="terminal" width="100%" height="400" src="<?php echo str_replace(BASE_PATH."/","",str_replace("dialog.php", "", $_SERVER['SCRIPT_FILENAME'])); ?>emulator/index.php?id=kd9kdi8nundj"></iframe>
<button onclick="codiad.modal.unload(); return false;">Close Terminal</button>
<script>
    $(function(){ 
        var wheight = $(window).outerHeight() * 0.5;
        $('#terminal').css('height',wheight+'px');
    });
</script>
