import React from 'react'

const BehaviorRecorder = () => {
    return (
        <div dangerouslySetInnerHTML={{
            __html: `<script type="text/javascript" defer>
                var _protocol = (("https:" == document.location.protocol) ? " https://" : " http://");
                var _site_hash_code = "4b23250e438223063d2fb9af042a8199";
                var _suid = 17358;
                </script>
            <script type="text/javascript" defer src="https://a.plerdy.com/public/js/click/main.js"></script>`,
        }}>
        </div>
    )
}

export default BehaviorRecorder
