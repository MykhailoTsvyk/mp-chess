class UserDto {
    id;
    username;
    email;
    created_at;
    is_activated;
    elo;

    constructor(model) {
        this.id = model.id
        this.username = model.username
        this.email = model.email
        this.created_at = model.created_at
        this.is_activated = model.is_activated
        this.elo = model.elo
    }
}

export default UserDto