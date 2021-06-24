/*
 * Review schema and data accessor methods.
 */

const mysqlPool = require('../lib/mysqlPool');
const { extractValidFields } = require('../lib/validation');
const bcrypt = require('bcryptjs');

/*
 * Schema describing required/optional fields of a business object.
 */
const UsersSchema = {
    id: { required: true },
    name: { required: true },
    email: { required: true },
    password: { required: true },
    admin: { required: false },
  };
  exports.UsersSchema = UsersSchema;
  
  
  /*
   * Executes a MySQL query to fetch the total number of Users.  Returns
   * a Promise that resolves to this count.
   */
  async function getUsersCount() {
    const [ results ] = await mysqlPool.query(
      'SELECT COUNT(*) AS count FROM users'
    );
    return results[0].count;
  }
  
  /*
   * Executes a MySQL query to return a single page of Users.  Returns a
   * Promise that resolves to an array containing the fetched page of Users.
   */
  async function getUsersPage(page) {
    /*
     * Compute last page number and make sure page is within allowed bounds.
     * Compute offset into collection.
     */
    const count = await getUsersCount();
    const pageSize = 10;
    const lastPage = Math.ceil(count / pageSize);
    page = page > lastPage ? lastPage : page;
    page = page < 1 ? 1 : page;
    const offset = (page - 1) * pageSize;
  
    const [ results ] = await mysqlPool.query(
      'SELECT * FROM users ORDER BY id LIMIT ?,?',
      [ offset, pageSize ]
    );
  
    return {
      Users: results,
      page: page,
      totalPages: lastPage,
      pageSize: pageSize,
      count: count
    };
  }
  exports.getUsersPage = getUsersPage;
  



/*
* Executes a MySQL query to insert a new business into the database.  Returns
* a Promise that resolves to the ID of the newly-created business entry.
*/
async function insertNewUser(user) {
  const userToInsert = extractValidFields(user, UsersSchema);
  console.log("  -- userToInsert before hashing:", userToInsert);
  userToInsert.password = await bcrypt.hash(userToInsert.password, 8);
  console.log("  -- userToInsert after hashing:", userToInsert);
  const [ result ] = await mysqlPool.query(
      'INSERT INTO users SET ?',
       userToInsert
  );
    
    console.log("---PASSWORD---\n" + user.password);
    return result.insertId;
  }
exports.insertNewUser = insertNewUser;
  
  /*
   * Executes a MySQL query to fetch information about a single specified
   * business based on its ID.  Does not fetch photo and review data for the
   * business.  Returns a Promise that resolves to an object containing
   * information about the requested business.  If no business with the
   * specified ID exists, the returned Promise will resolve to null.
   */
  async function getUserById(id) {
    const [ results ] = await mysqlPool.query(
      'SELECT * FROM users WHERE id = ?',
      [ id ]
    );
    return results[0];
  }
  exports.getUserById = getUserById;

  /*
   * Executes a MySQL query to replace a specified business with new data.
   * Returns a Promise that resolves to true if the business specified by
   * `id` existed and was successfully updated or to false otherwise.
   */
  async function replaceUserById(id, users) {
    users = extractValidFields(users, UsersSchema);
    const [ result ] = await mysqlPool.query(
      'UPDATE users SET ? WHERE id = ?',
      [ business, id ]
    );
    return result.affectedRows > 0;
  }
  exports.replaceUserById = replaceUserById;
  
  /*
   * Executes a MySQL query to delete a business specified by its ID.  Returns
   * a Promise that resolves to true if the business specified by `id` existed
   * and was successfully deleted or to false otherwise.
   */
  async function deleteUserById(id) {
    const [ result ] = await mysqlPool.query(
      'DELETE FROM users WHERE id = ?',
      [ id ]
    );
    return result.affectedRows > 0;
  }
  exports.deleteUserById = deleteUserById;

  async function validateUser(id, password) {
    // console.log("password: ", password);
    const user = await getUserById(id);
    return user && await bcrypt.compare(password, user.password);
  }
  exports.validateUser = validateUser;

  