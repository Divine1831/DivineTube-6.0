/* =========================================
   AUTH
========================================= */

async function authPage() {

  const s = getSb();
  const f = $('#authForm');

  if (!f || !s) return;

  f.onsubmit = async e => {

    e.preventDefault();

    const signup =
      window.isSignup === true;

    const email =
      $('#email')?.value.trim();

    const password =
      $('#password')?.value || '';

    const user =
      $('#username')?.value.trim() || '';

    const msg =
      $('#msg');

    const submit =
      $('#authSubmit');

    if (!email || !password) {

      if (msg) {
        msg.textContent =
          'Please enter your email and password.';
      }

      return;
    }

    if (signup && !user) {

      if (msg) {
        msg.textContent =
          'Please choose a username.';
      }

      return;
    }

    if (msg) {
      msg.textContent =
        signup
          ? 'Creating your account…'
          : 'Logging you in…';
    }

    if (submit) {
      submit.disabled = true;

      submit.textContent =
        signup
          ? 'Creating account…'
          : 'Logging in…';
    }

    try {

      let r;

      if (signup) {

        r = await s.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: user
            }
          }
        });

      } else {

        r =
          await s.auth.signInWithPassword({
            email,
            password
          });
      }

      if (r.error) {

        if (msg) {
          msg.textContent =
            r.error.message;
        }

        return;
      }

      if (signup && !r.data.session) {

        if (msg) {
          msg.textContent =
            'Account created! Check your email to verify your account.';
        }

        return;
      }

      if (msg) {
        msg.textContent =
          'Login successful!';
      }

      setTimeout(() => {
        location.href = 'index.html';
      }, 500);

    } catch (error) {

      console.error(error);

      if (msg) {
        msg.textContent =
          'Something went wrong. Please try again.';
      }

    } finally {

      if (submit) {
        submit.disabled = false;

        submit.textContent =
          signup
            ? 'Create account'
            : 'Log in';
      }
    }
  };

  /* FORGOT PASSWORD */

  $('#forgotPassword')?.addEventListener(
    'click',
    async () => {

      const email =
        $('#email')?.value.trim();

      const msg =
        $('#msg');

      if (!email) {

        if (msg) {
          msg.textContent =
            'Enter your email first.';
        }

        return;
      }

      if (msg) {
        msg.textContent =
          'Sending password reset email…';
      }

      const { error } =
        await s.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              `${location.origin}/update-password.html`
          }
        );

      if (error) {

        if (msg) {
          msg.textContent =
            error.message;
        }

        return;
      }

      if (msg) {
        msg.textContent =
          'Check your email for the password reset link.';
      }
    }
  );
}
