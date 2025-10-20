class UserModel extends BaseModel {
    constructor(email, password, name, role) {
        super('users');
    }



}

const newUser = new UserModel("mathijs.fol.", "password", "mathijs", "vendor");
newUser.create(); // Try create instance

UserModel.all(); // geeft alle users terug
UserModel.get({id: 50, name: "Mathijs"}) // User where param

/*
users:
- id (PK) 
- uuid -> as discord id :P
- email
- password_hash
- name
- role -> user / vendor / admin
- created_at

*/