function getTimeRemaining() {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                let response = JSON.parse(xhr.responseText);
                // Check if the server indicated redirection is required
                if (response.redirect) {
                    window.location.href = response.redirect_url;
                } else {
                    let remainingTime = parseInt(response.remaining_time); 
                    // Check if remaining time is 5 minutes or less (300 seconds)
                    if (remainingTime <= 300 && remainingTime > 0) {
                        const confirmation = confirm("Your session will expire in 5 minutes. Do you want to reset your session time?");
                        if (confirmation) {
                            window.location.reload();
                        }
                    }
                }
            } else if (xhr.status === 401) {
                window.location.href = "php/logoff.php?error=*session+timeout"
            }
             else {
                console.error('Error occurred:', xhr.status, xhr.statusText);
            }
        }
    };

    xhr.open('GET', window.location.pathname, true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.send();
}
window.addEventListener("load", function(){
    // Request a session reset after 10 minutes of inactivity
    // on an interval of 1 minute to redirect user once session timeout
    setTimeout(() => {
        setInterval(() => {
            getTimeRemaining();
        }, 60000);
    }, 600000);
})
