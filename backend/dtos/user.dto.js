class UserDto {
    id;
    username;
    email;
    created_at;

    constructor(model) {
        this.id = model.id
        this.username = model.username
        this.email = model.email
        this.created_at = model.created_at
    }
}

export default UserDto