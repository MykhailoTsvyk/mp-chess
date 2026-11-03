class UserDto {
    id;
    username;
    email;
    created_at;
    is_activated;
    ratings;

    constructor(model) {
        this.id = model.id
        this.username = model.username
        this.email = model.email
        this.created_at = model.created_at
        this.is_activated = model.is_activated
        this.ratings = {
            bullet: model.elo_bullet,
            blitz: model.elo_blitz,
            rapid: model.elo_rapid
        }
    }
}

export default UserDto
