export const validators = {
  isValidEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).trim());
  },

  isNonEmpty(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim().length > 0;
  },

  isNumericOnly(value: string): boolean {
    // Parity with website's isNumberKey(event)
    return /^\d*$/.test(value.trim());
  },

  isValidPhone(phone: string): boolean {
    if (!phone) return true; // optional
    const clean = phone.replace(/[\s\-()]/g, '');
    return /^\+?\d{7,15}$/.test(clean);
  },

  isValidPostCode(code: string): boolean {
    return /^[a-zA-Z0-9\s-]{3,10}$/.test(code.trim());
  },

  validateRegistrationForm(data: {
    email: string;
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    state: string;
    country: string;
    postCode: string;
    phone?: string;
    mobile?: string;
  }): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    if (!this.isNonEmpty(data.email)) {
      errors.email = 'Email Address is required';
    } else if (!this.isValidEmail(data.email)) {
      errors.email = 'Invalid Email format';
    }

    if (!this.isNonEmpty(data.firstName)) {
      errors.firstName = 'First name is required';
    }

    if (!this.isNonEmpty(data.lastName)) {
      errors.lastName = 'Last name is required';
    }

    if (!this.isNonEmpty(data.address1)) {
      errors.address1 = 'Address Line 1 is required';
    }

    if (!this.isNonEmpty(data.city)) {
      errors.city = 'City is required';
    }

    if (!this.isNonEmpty(data.state)) {
      errors.state = 'State is required';
    }

    if (!this.isNonEmpty(data.country)) {
      errors.country = 'Country is required';
    }

    if (!this.isNonEmpty(data.postCode)) {
      errors.postCode = 'Postcode is required';
    } else if (!this.isNumericOnly(data.postCode)) {
      errors.postCode = 'Postcode must contain only digits';
    }

    if (data.phone && !this.isNumericOnly(data.phone.replace(/[\s\-+]/g, ''))) {
      errors.phone = 'Phone must contain only numbers';
    }

    if (data.mobile && !this.isNumericOnly(data.mobile.replace(/[\s\-+]/g, ''))) {
      errors.mobile = 'Mobile must contain only numbers';
    }

    return errors;
  },

  validateContactForm(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    if (!this.isNonEmpty(data.name)) {
      errors.name = "Name can't be empty !";
    }

    if (!this.isNonEmpty(data.email)) {
      errors.email = "Email Address can't be empty !";
    } else if (!this.isValidEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!this.isNonEmpty(data.subject)) {
      errors.subject = "Subject can't be empty !";
    }

    if (!this.isNonEmpty(data.message)) {
      errors.message = "message can't be empty !";
    }

    return errors;
  },
};
