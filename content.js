function w(e, n) {
    return e.includes("checking your browser") ? 1 : e.includes("token_expired") ? 2 : !1
}

function v(e) {
    return e.replace(/\\u([a-fA-F0-9]{4})/g, function(n, t) {
        return String.fromCharCode(parseInt(t, 16))
    })
}

function k(e) {
    let n = 0,
        t = new Array;
    for (; e.indexOf("{{", n) != -1;) t.push(e.slice(e.indexOf("{{", n) + 2, e.indexOf("}}", n))), n = e.indexOf("}}", n) + 2;
    return t
}

function T(e) {
    let n = 0,
        t = 1,
        a = "",
        i = new Array;
    for (; e.indexOf(t + ". ", n) != -1;) a = t + 1 + ". ", i.push(e.slice(e.indexOf(t + ". ", n) + 3, e.indexOf(a, n))), n = e.indexOf(a, n);
    return i
}

function s(e, n) {
    var t = {};
    return t.texts = e, t.noCredit = n, t.help_message = {}, t
}
async function _(e) {
    let t = await (await fetch("https://chat.openai.com/api/auth/session", {
            headers: {
                cookie: "__Secure-next-auth.session-token=" + e
            }
        })).text(),
        a = w(t);
    if (a !== !1) return a;
    t = JSON.parse(t);
    const i = t.accessToken;
    if (!i) throw new Error("Unable to get access token");
    return i
}

chrome.runtime.onMessage.addListener(function(e, n, t) {
    if ((e == null ? void 0 : e.action) === "chatgptapi-message") {
		chrome.runtime.sendMessage({ action: "chatgptapi-getcookies" }).then(async a => {
			a = e.cookies;
			var i = a.find(d => d.name === "__Secure-next-auth.session-token");
			if (i === void 0) {
				t({
					status: 200,
					statusText: "ok",
					body: JSON.stringify(s([], 2))
				});
				return
			}
			let y = i.value;
			const c = await _(y);
			if (Number.isInteger(c)) {
				t({
					status: 200,
					statusText: "ok",
					body: JSON.stringify(s([], c))
				});
				return
			}
			const h = new Headers;
			h.append("content-type", "application/json"), h.append("authorization", "Bearer " + c);
			r = e.message;

			const b = {
				action: "next",
				messages: [{
					id: crypto.randomUUID(),
					role: "user",
					content: {
						content_type: "text",
						parts: [r]
					}
				}],
				model: "text-davinci-002-render",
				parent_message_id: crypto.randomUUID()
			};
			var x = JSON.stringify(b);
			const l = await fetch("https://chat.openai.com/backend-api/conversation", {
				method: "POST",
				headers: h,
				body: x
			});
			let p = await l.text(),
				g = w(p);
			if (g !== !1) {
				t({
					status: 200,
					statusText: "ok",
					body: JSON.stringify(s([], g))
				});
				return
			}
			let f = p.split(`

`).map(d => d),
				m = v(f[f.length - 3]),
				u = k(m);
			var return_data = f[f.length - 3];
			return_data = return_data.substring(6);
			return_data = JSON.parse(return_data);
			var answer = return_data.message.content.parts[0];
			console.log(answer);
			return answer;
		}).then(t);
		return true;
	}
});